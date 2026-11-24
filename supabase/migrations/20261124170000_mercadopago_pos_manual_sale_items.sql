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

  if found and v_prev.completed_sale_id is not null then
    return v_prev.completed_sale_id;
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

  if v_pending.items is null
    or jsonb_typeof(v_pending.items) <> 'array'
    or jsonb_array_length(v_pending.items) = 0
  then
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

    if v_qty <= 0 then
      raise exception 'invalid_quantity';
    end if;

    if v_product_id is not null then
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

notify pgrst, 'reload schema';
