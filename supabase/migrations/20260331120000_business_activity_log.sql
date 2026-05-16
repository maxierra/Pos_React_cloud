-- Registro de actividad por negocio (ventas, anulaciones, productos, inicio de sesión).

create table if not exists public.business_activity_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  kind text not null,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  entity_type text,
  entity_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists business_activity_events_business_created_idx
  on public.business_activity_events (business_id, created_at desc);
create index if not exists business_activity_events_business_user_created_idx
  on public.business_activity_events (business_id, user_id, created_at desc);

alter table public.business_activity_events enable row level security;

drop policy if exists business_activity_events_select on public.business_activity_events;

create policy business_activity_events_select on public.business_activity_events
for select
to authenticated
using (public.is_business_member(business_id));

-- Inserción solo vía triggers / funciones security definer (no insert directo desde el cliente)

create or replace function public.record_session_activity(p_business_id uuid)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if not public.is_business_member(p_business_id) then
    raise exception 'not_authorized';
  end if;

  insert into public.business_activity_events (business_id, user_id, kind, summary, metadata)
  values (
    p_business_id,
    auth.uid(),
    'session_start',
    'Inicio de sesión en el sistema',
    '{}'::jsonb
  );
end;
$$;

revoke all on function public.record_session_activity(uuid) from public;
grant execute on function public.record_session_activity(uuid) to authenticated;

-- Emails de miembros (solo lectura para armar la UI de empleados)
create or replace function public.business_member_emails(p_business_id uuid)
returns table (user_id uuid, email text)
language sql
security definer
set search_path = public
set row_security = off
stable
as $$
  select u.id, coalesce(u.email, '')::text
  from auth.users u
  inner join public.memberships m
    on m.user_id = u.id
   and m.business_id = p_business_id
   and m.deleted_at is null;
$$;

revoke all on function public.business_member_emails(uuid) from public;
grant execute on function public.business_member_emails(uuid) to authenticated;

-- Helper: email para mostrar en triggers
create or replace function public._activity_actor_email(p_uid uuid)
returns text
language sql
security definer
set search_path = public
set row_security = off
stable
as $$
  select coalesce((select email::text from auth.users where id = p_uid limit 1), '');
$$;

revoke all on function public._activity_actor_email(uuid) from public;

create or replace function public.log_sales_activity()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_email text;
begin
  if tg_op <> 'update' then
    return new;
  end if;

  -- Venta cobrada (total finalizado)
  if new.status = 'paid'
     and coalesce(new.total, 0) > 0
     and (
       old.total is distinct from new.total
       or old.status is distinct from new.status
     )
     and not exists (
       select 1 from public.business_activity_events e
       where e.entity_id = new.id
         and e.kind = 'sale'
     )
  then
    v_email := public._activity_actor_email(new.cashier_user_id);
    insert into public.business_activity_events (
      business_id, user_id, kind, summary, metadata, entity_type, entity_id
    )
    values (
      new.business_id,
      new.cashier_user_id,
      'sale',
      'Venta · ' || to_char(new.total, 'FM999999990.00') || ' · ' || coalesce(new.payment_method, ''),
      jsonb_build_object(
        'total', new.total,
        'payment_method', new.payment_method,
        'cashier_email', nullif(v_email, '')
      ),
      'sale',
      new.id
    );
  end if;

  -- Anulación de venta
  if new.status = 'voided'
     and old.status = 'paid'
     and old.status is distinct from new.status
     and not exists (
       select 1 from public.business_activity_events e
       where e.entity_id = new.id
         and e.kind = 'sale_void'
     )
  then
    v_email := public._activity_actor_email(auth.uid());
    insert into public.business_activity_events (
      business_id, user_id, kind, summary, metadata, entity_type, entity_id
    )
    values (
      new.business_id,
      auth.uid(),
      'sale_void',
      'Anuló venta · ' || to_char(old.total, 'FM999999990.00'),
      jsonb_build_object(
        'previous_total', old.total,
        'actor_email', nullif(v_email, '')
      ),
      'sale',
      new.id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists sales_activity_log_trigger on public.sales;
create trigger sales_activity_log_trigger
  after update on public.sales
  for each row
  execute procedure public.log_sales_activity();

create or replace function public.log_products_activity()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_email text;
  v_parts text[] := array[]::text[];
  v_summary text;
begin
  v_email := public._activity_actor_email(auth.uid());

  if tg_op = 'insert' then
    insert into public.business_activity_events (
      business_id, user_id, kind, summary, metadata, entity_type, entity_id
    )
    values (
      new.business_id,
      auth.uid(),
      'product_create',
      'Alta producto · ' || left(new.name, 80),
      jsonb_build_object('name', new.name, 'price', new.price, 'actor_email', nullif(v_email, '')),
      'product',
      new.id
    );
    return new;
  end if;

  if tg_op = 'delete' then
    insert into public.business_activity_events (
      business_id, user_id, kind, summary, metadata, entity_type, entity_id
    )
    values (
      old.business_id,
      auth.uid(),
      'product_delete',
      'Eliminó producto · ' || left(old.name, 80),
      jsonb_build_object('name', old.name, 'actor_email', nullif(v_email, '')),
      'product',
      old.id
    );
    return old;
  end if;

  if tg_op = 'update' then
    -- Durante venta/anulación solo registramos cambios de datos (no el descuento de stock automático)
    if coalesce(current_setting('app.product_activity_source', true), '') in ('sale', 'void_sale') then
      if (old.price is not distinct from new.price)
         and (old.cost is not distinct from new.cost)
         and (old.name is not distinct from new.name)
         and (old.active is not distinct from new.active)
      then
        return new;
      end if;
    end if;

    if old.price is distinct from new.price then
      v_parts := array_append(v_parts,
        'Precio ' || to_char(old.price, 'FM999999990.99') || ' → ' || to_char(new.price, 'FM999999990.99'));
    end if;
    if old.cost is distinct from new.cost then
      v_parts := array_append(v_parts, 'Costo actualizado');
    end if;
    if old.stock is distinct from new.stock or old.stock_decimal is distinct from new.stock_decimal then
      v_parts := array_append(v_parts,
        'Stock ' || coalesce(old.stock::text, '0') || '/' || coalesce(to_char(old.stock_decimal, 'FM999999990.999'), '0')
        || ' → ' || coalesce(new.stock::text, '0') || '/' || coalesce(to_char(new.stock_decimal, 'FM999999990.999'), '0'));
    end if;
    if old.name is distinct from new.name then
      v_parts := array_append(v_parts, 'Nombre');
    end if;
    if old.active is distinct from new.active then
      v_parts := array_append(v_parts, case when new.active then 'Activó' else 'Desactivó' end);
    end if;

    if array_length(v_parts, 1) is null or array_length(v_parts, 1) = 0 then
      return new;
    end if;

    v_summary := 'Producto · ' || left(new.name, 60) || ' · ' || array_to_string(v_parts, ' · ');

    insert into public.business_activity_events (
      business_id, user_id, kind, summary, metadata, entity_type, entity_id
    )
    values (
      new.business_id,
      auth.uid(),
      'product_update',
      left(v_summary, 500),
      jsonb_build_object(
        'product_name', new.name,
        'changes', to_jsonb(v_parts),
        'old_price', old.price,
        'new_price', new.price,
        'old_stock', old.stock,
        'new_stock', new.stock,
        'old_stock_decimal', old.stock_decimal,
        'new_stock_decimal', new.stock_decimal,
        'actor_email', nullif(v_email, '')
      ),
      'product',
      new.id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists products_activity_insert on public.products;
create trigger products_activity_insert
  after insert on public.products
  for each row
  execute procedure public.log_products_activity();

drop trigger if exists products_activity_update on public.products;
create trigger products_activity_update
  after update on public.products
  for each row
  execute procedure public.log_products_activity();

drop trigger if exists products_activity_delete on public.products;
create trigger products_activity_delete
  after delete on public.products
  for each row
  execute procedure public.log_products_activity();

-- Marcar contexto para no auditar solo-stock en ventas / anulaciones / MP
create or replace function public.create_sale_with_items(
  p_business_id uuid,
  p_payment_method text,
  p_payment_details jsonb,
  p_items jsonb,
  p_customer_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_sale_id uuid;
  v_open_register_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_name text;
  v_qty numeric(12,3);
  v_unit_price numeric(12,2);
  v_total numeric(12,2);
  v_sold_by_weight boolean;
  v_stock_int integer;
  v_stock_dec numeric(12,3);
  v_sale_total numeric(12,2);
  v_pre_total numeric(12,2);
  v_credit_limit numeric(12,2);
  v_balance numeric(12,2);
  v_cust_business uuid;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  if not public.is_business_member(p_business_id) then
    raise exception 'not_authorized';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'empty_items';
  end if;

  if p_payment_method = 'cuenta_corriente' then
    if p_customer_id is null then
      raise exception 'customer_required_for_cuenta_corriente';
    end if;
    select c.business_id, c.credit_limit
      into v_cust_business, v_credit_limit
    from public.business_customers c
    where c.id = p_customer_id
    for update;

    if not found then
      raise exception 'customer_not_found';
    end if;
    if v_cust_business is distinct from p_business_id then
      raise exception 'customer_wrong_business';
    end if;
    if coalesce(v_credit_limit, 0) <= 0 then
      raise exception 'customer_no_credit_limit';
    end if;
  end if;

  v_pre_total := 0;
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := nullif(v_item->>'product_id', '')::uuid;
    v_qty := coalesce((v_item->>'quantity')::numeric, 0);
    v_unit_price := coalesce((v_item->>'unit_price')::numeric, 0);
    if v_product_id is null then
      raise exception 'missing_product_id';
    end if;
    if v_qty <= 0 then
      raise exception 'invalid_quantity';
    end if;
    if not exists (
      select 1 from public.products p
      where p.id = v_product_id and p.business_id = p_business_id
    ) then
      raise exception 'product_not_found';
    end if;
    v_pre_total := v_pre_total + round((v_qty * v_unit_price)::numeric, 2);
  end loop;

  if p_payment_method = 'cuenta_corriente' then
    v_balance := public.customer_balance(p_customer_id);
    if v_balance + v_pre_total > v_credit_limit then
      raise exception 'credit_limit_exceeded';
    end if;
  end if;

  select cr.id
    into v_open_register_id
  from public.cash_registers cr
  where cr.business_id = p_business_id
    and cr.closed_at is null
  order by cr.opened_at desc
  limit 1;

  insert into public.sales (business_id, cashier_user_id, total, payment_method, payment_details, status, customer_id)
  values (
    p_business_id,
    auth.uid(),
    0,
    p_payment_method,
    p_payment_details,
    'paid',
    case when p_payment_method = 'cuenta_corriente' then p_customer_id else null end
  )
  returning id into v_sale_id;

  if v_open_register_id is not null then
    update public.sales
      set cash_register_id = v_open_register_id
    where id = v_sale_id;
  end if;

  perform set_config('app.product_activity_source', 'sale', true);

  v_sale_total := 0;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := nullif(v_item->>'product_id', '')::uuid;
    v_name := coalesce(nullif(v_item->>'name', ''), 'Producto');
    v_qty := coalesce((v_item->>'quantity')::numeric, 0);
    v_unit_price := coalesce((v_item->>'unit_price')::numeric, 0);

    select p.sold_by_weight, p.stock, p.stock_decimal
      into v_sold_by_weight, v_stock_int, v_stock_dec
    from public.products p
    where p.id = v_product_id
      and p.business_id = p_business_id
    for update;

    if v_sold_by_weight then
      if v_stock_dec < v_qty then
        raise exception 'insufficient_stock';
      end if;
      update public.products
        set stock_decimal = stock_decimal - v_qty,
            updated_at = now()
        where id = v_product_id
          and business_id = p_business_id;
    else
      if v_stock_int < ceil(v_qty)::int then
        raise exception 'insufficient_stock';
      end if;
      update public.products
        set stock = stock - ceil(v_qty)::int,
            updated_at = now()
        where id = v_product_id
          and business_id = p_business_id;
    end if;

    v_total := round((v_qty * v_unit_price)::numeric, 2);
    v_sale_total := v_sale_total + v_total;

    insert into public.sale_items (business_id, sale_id, product_id, name, quantity, unit_price, total)
    values (p_business_id, v_sale_id, v_product_id, v_name, v_qty, v_unit_price, v_total);
  end loop;

  update public.sales
    set total = v_sale_total
  where id = v_sale_id;

  return v_sale_id;
end;
$$;

revoke all on function public.create_sale_with_items(uuid, text, jsonb, jsonb, uuid) from public;
grant execute on function public.create_sale_with_items(uuid, text, jsonb, jsonb, uuid) to authenticated;

create or replace function public.void_sale(
  p_business_id uuid,
  p_sale_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_status text;
  v_item record;
  v_sold_by_weight boolean;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  if not public.is_business_member(p_business_id) then
    raise exception 'not_authorized';
  end if;

  select s.status
    into v_status
  from public.sales s
  where s.id = p_sale_id
    and s.business_id = p_business_id
  for update;

  if not found then
    raise exception 'sale_not_found';
  end if;

  if v_status <> 'paid' then
    raise exception 'sale_not_paid';
  end if;

  perform set_config('app.product_activity_source', 'void_sale', true);

  for v_item in
    select si.product_id, si.quantity
    from public.sale_items si
    where si.sale_id = p_sale_id
      and si.business_id = p_business_id
  loop
    if v_item.product_id is null then
      continue;
    end if;

    select p.sold_by_weight
      into v_sold_by_weight
    from public.products p
    where p.id = v_item.product_id
      and p.business_id = p_business_id
    for update;

    if not found then
      continue;
    end if;

    if v_sold_by_weight then
      update public.products
        set stock_decimal = stock_decimal + v_item.quantity,
            updated_at = now()
      where id = v_item.product_id
        and business_id = p_business_id;
    else
      update public.products
        set stock = stock + ceil(v_item.quantity)::int,
            updated_at = now()
      where id = v_item.product_id
        and business_id = p_business_id;
    end if;
  end loop;

  update public.sales
    set status = 'voided'
  where id = p_sale_id
    and business_id = p_business_id;
end;
$$;

revoke all on function public.void_sale(uuid, uuid) from public;
grant execute on function public.void_sale(uuid, uuid) to authenticated;

create or replace function public.mercadopago_pos_complete_pending(
  p_external_reference text,
  p_mp_payment_id text,
  p_paid_amount numeric,
  p_currency_id text
)
returns uuid
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_prev record;
  v_pending record;
  v_sale_id uuid;
  v_open_register_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_name text;
  v_qty numeric(12, 3);
  v_unit_price numeric(12, 2);
  v_total numeric(12, 2);
  v_sold_by_weight boolean;
  v_stock_int integer;
  v_stock_dec numeric(12, 3);
  v_sale_total numeric(12, 2);
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'forbidden';
  end if;

  if p_external_reference is null or length(trim(p_external_reference)) = 0 then
    return null;
  end if;

  if p_mp_payment_id is null or length(trim(p_mp_payment_id)) = 0 then
    return null;
  end if;

  select *
    into v_prev
  from public.mercado_pago_pos_pending_sales
  where mp_payment_id = trim(p_mp_payment_id)
  limit 1;

  if found then
    if v_prev.completed_sale_id is not null then
      return v_prev.completed_sale_id;
    end if;
  end if;

  select *
    into v_pending
  from public.mercado_pago_pos_pending_sales
  where external_reference = trim(p_external_reference)
  for update;

  if not found then
    return null;
  end if;

  if v_pending.status = 'cancelled_manual' then
    return null;
  end if;

  if v_pending.status = 'completed' and v_pending.completed_sale_id is not null then
    return v_pending.completed_sale_id;
  end if;

  if v_pending.expires_at < now() then
    return null;
  end if;

  if upper(trim(coalesce(p_currency_id, ''))) is distinct from 'ARS' then
    raise exception 'currency_mismatch';
  end if;

  if abs(round(p_paid_amount::numeric, 2) - v_pending.expected_total) > 0.02 then
    raise exception 'amount_mismatch';
  end if;

  if v_pending.items is null or jsonb_typeof(v_pending.items) <> 'array' or jsonb_array_length(v_pending.items) = 0 then
    raise exception 'empty_items';
  end if;

  select cr.id
    into v_open_register_id
  from public.cash_registers cr
  where cr.business_id = v_pending.business_id
    and cr.closed_at is null
  order by cr.opened_at desc
  limit 1;

  insert into public.sales (business_id, cashier_user_id, total, payment_method, payment_details, status)
  values (
    v_pending.business_id,
    null,
    0,
    v_pending.payment_method,
    coalesce(v_pending.payment_details, '{}'::jsonb) || jsonb_build_object(
      'mercadopago_payment_id', trim(p_mp_payment_id),
      'mercadopago_external_reference', trim(p_external_reference)
    ),
    'paid'
  )
  returning id into v_sale_id;

  if v_open_register_id is not null then
    update public.sales
      set cash_register_id = v_open_register_id
    where id = v_sale_id;
  end if;

  perform set_config('app.product_activity_source', 'sale', true);

  v_sale_total := 0;

  for v_item in select * from jsonb_array_elements(v_pending.items)
  loop
    v_product_id := nullif(v_item ->> 'product_id', '')::uuid;
    v_name := coalesce(nullif(v_item ->> 'name', ''), 'Producto');
    v_qty := coalesce((v_item ->> 'quantity')::numeric, 0);
    v_unit_price := coalesce((v_item ->> 'unit_price')::numeric, 0);

    if v_product_id is null then
      raise exception 'missing_product_id';
    end if;
    if v_qty <= 0 then
      raise exception 'invalid_quantity';
    end if;

    select p.sold_by_weight, p.stock, p.stock_decimal
      into v_sold_by_weight, v_stock_int, v_stock_dec
    from public.products p
    where p.id = v_product_id
      and p.business_id = v_pending.business_id
    for update;

    if not found then
      raise exception 'product_not_found';
    end if;

    if v_sold_by_weight then
      if v_stock_dec < v_qty then
        raise exception 'insufficient_stock';
      end if;
      update public.products
        set stock_decimal = stock_decimal - v_qty,
            updated_at = now()
      where id = v_product_id
        and business_id = v_pending.business_id;
    else
      if v_stock_int < ceil(v_qty)::int then
        raise exception 'insufficient_stock';
      end if;
      update public.products
        set stock = stock - ceil(v_qty)::int,
            updated_at = now()
        where id = v_product_id
        and business_id = v_pending.business_id;
    end if;

    v_total := round((v_qty * v_unit_price)::numeric, 2);
    v_sale_total := v_sale_total + v_total;

    insert into public.sale_items (business_id, sale_id, product_id, name, quantity, unit_price, total)
    values (v_pending.business_id, v_sale_id, v_product_id, v_name, v_qty, v_unit_price, v_total);
  end loop;

  update public.sales
    set total = v_sale_total
  where id = v_sale_id;

  update public.mercado_pago_pos_pending_sales
    set status = 'completed',
        completed_sale_id = v_sale_id,
        mp_payment_id = trim(p_mp_payment_id)
  where id = v_pending.id;

  return v_sale_id;
end;
$$;

revoke all on function public.mercadopago_pos_complete_pending(text, text, numeric, text) from public;
grant execute on function public.mercadopago_pos_complete_pending(text, text, numeric, text) to service_role;
