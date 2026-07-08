create or replace function public.customer_balance(p_customer_id uuid)
returns numeric
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select round(
    coalesce((
      select sum(
        case
          when s.payment_method = 'cuenta_corriente' then s.total
          when s.payment_method = 'mixed' then coalesce((
            select sum(coalesce((part->>'amount')::numeric, 0))
            from jsonb_array_elements(coalesce(s.payment_details->'split', '[]'::jsonb)) part
            where part->>'method' = 'cuenta_corriente'
          ), 0)
          else 0
        end
      )
      from public.sales s
      where s.customer_id = p_customer_id
        and s.status = 'paid'
    ), 0)
    -
    coalesce((
      select sum(p.amount)
      from public.customer_account_payments p
      where p.customer_id = p_customer_id
    ), 0),
    2
  );
$$;

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
  v_promo_amount numeric(12,2);
  v_total_net numeric(12,2);
  v_cc_amount numeric(12,2) := 0;
  v_uses_cc boolean := false;
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
    v_uses_cc := true;
  elsif p_payment_method = 'mixed' then
    select coalesce(sum(coalesce((part->>'amount')::numeric, 0)), 0)
      into v_cc_amount
    from jsonb_array_elements(coalesce(p_payment_details->'split', '[]'::jsonb)) part
    where part->>'method' = 'cuenta_corriente';

    v_uses_cc := v_cc_amount > 0;
  end if;

  if v_uses_cc then
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
    v_cc_amount := v_pre_total;
  end if;

  if v_uses_cc then
    v_balance := public.customer_balance(p_customer_id);
    if v_balance + v_cc_amount > v_credit_limit then
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
    case when v_uses_cc then p_customer_id else null end
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

  v_promo_amount := coalesce((p_payment_details->'promotion'->>'amount')::numeric, 0);
  v_total_net := greatest(0, coalesce(v_sale_total, 0) - coalesce(v_promo_amount, 0));

  update public.sales
    set total = v_total_net
  where id = v_sale_id;

  return v_sale_id;
end;
$$;

create or replace function public.close_cash_register(
  p_business_id uuid,
  p_cash_register_id uuid,
  p_closing_amount numeric,
  p_closing_totals jsonb,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_opening_amount numeric(12,2);
  v_expected_cash numeric(12,2);
  v_expected_card numeric(12,2);
  v_expected_transfer numeric(12,2);
  v_expected_mp numeric(12,2);
  v_expected_cc_sales numeric(12,2);
  v_cap_cash numeric(12,2);
  v_cap_card numeric(12,2);
  v_cap_transfer numeric(12,2);
  v_cap_mp numeric(12,2);
  v_counted_cash numeric(12,2);
  v_counted_card numeric(12,2);
  v_counted_transfer numeric(12,2);
  v_counted_mp numeric(12,2);
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if not public.is_business_member(p_business_id) then
    raise exception 'not_authorized';
  end if;
  if coalesce(p_closing_amount, 0) < 0 then
    raise exception 'invalid_closing_amount';
  end if;

  select coalesce(cr.opening_amount, 0)
    into v_opening_amount
  from public.cash_registers cr
  where cr.id = p_cash_register_id
    and cr.business_id = p_business_id
    and cr.closed_at is null
  for update;

  if not found then
    raise exception 'cash_register_not_open';
  end if;

  select
    coalesce(sum(case
      when s.status = 'paid' and s.payment_method = 'cash' then s.total
      when s.status = 'paid' and s.payment_method = 'mixed' and sp->>'method' = 'cash' then coalesce((sp->>'amount')::numeric, 0)
      else 0 end), 0),
    coalesce(sum(case
      when s.status = 'paid' and s.payment_method = 'card' then s.total
      when s.status = 'paid' and s.payment_method = 'mixed' and sp->>'method' = 'card' then coalesce((sp->>'amount')::numeric, 0)
      else 0 end), 0),
    coalesce(sum(case
      when s.status = 'paid' and s.payment_method = 'transfer' then s.total
      when s.status = 'paid' and s.payment_method = 'mixed' and sp->>'method' = 'transfer' then coalesce((sp->>'amount')::numeric, 0)
      else 0 end), 0),
    coalesce(sum(case
      when s.status = 'paid' and s.payment_method = 'mercadopago' then s.total
      when s.status = 'paid' and s.payment_method = 'mixed' and sp->>'method' = 'mercadopago' then coalesce((sp->>'amount')::numeric, 0)
      else 0 end), 0),
    coalesce(sum(case
      when s.status = 'paid' and s.payment_method = 'cuenta_corriente' then s.total
      when s.status = 'paid' and s.payment_method = 'mixed' and sp->>'method' = 'cuenta_corriente' then coalesce((sp->>'amount')::numeric, 0)
      else 0 end), 0)
  into v_expected_cash, v_expected_card, v_expected_transfer, v_expected_mp, v_expected_cc_sales
  from public.sales s
  left join lateral jsonb_array_elements(coalesce(s.payment_details->'split', '[]'::jsonb)) sp on s.payment_method = 'mixed'
  where s.business_id = p_business_id
    and s.cash_register_id = p_cash_register_id;

  select
    coalesce(sum(case when payment_method = 'cash' then amount else 0 end), 0),
    coalesce(sum(case when payment_method = 'card' then amount else 0 end), 0),
    coalesce(sum(case when payment_method = 'transfer' then amount else 0 end), 0),
    coalesce(sum(case when payment_method = 'mercadopago' then amount else 0 end), 0)
  into v_cap_cash, v_cap_card, v_cap_transfer, v_cap_mp
  from public.customer_account_payments
  where business_id = p_business_id
    and cash_register_id = p_cash_register_id;

  v_expected_cash := coalesce(v_expected_cash, 0) + coalesce(v_cap_cash, 0);
  v_expected_card := coalesce(v_expected_card, 0) + coalesce(v_cap_card, 0);
  v_expected_transfer := coalesce(v_expected_transfer, 0) + coalesce(v_cap_transfer, 0);
  v_expected_mp := coalesce(v_expected_mp, 0) + coalesce(v_cap_mp, 0);

  select
    v_expected_cash + coalesce(sum(case when movement_type = 'in' and payment_method = 'cash' then amount when movement_type = 'out' and payment_method = 'cash' then -amount else 0 end), 0),
    v_expected_card + coalesce(sum(case when movement_type = 'in' and payment_method = 'card' then amount when movement_type = 'out' and payment_method = 'card' then -amount else 0 end), 0),
    v_expected_transfer + coalesce(sum(case when movement_type = 'in' and payment_method = 'transfer' then amount when movement_type = 'out' and payment_method = 'transfer' then -amount else 0 end), 0),
    v_expected_mp + coalesce(sum(case when movement_type = 'in' and payment_method = 'mercadopago' then amount when movement_type = 'out' and payment_method = 'mercadopago' then -amount else 0 end), 0)
  into v_expected_cash, v_expected_card, v_expected_transfer, v_expected_mp
  from public.cash_movements cm
  where cm.business_id = p_business_id
    and cm.cash_register_id = p_cash_register_id;

  v_expected_cash := v_opening_amount + coalesce(v_expected_cash, 0);

  v_counted_cash := coalesce((p_closing_totals->>'cash')::numeric, p_closing_amount, 0);
  v_counted_card := coalesce((p_closing_totals->>'card')::numeric, 0);
  v_counted_transfer := coalesce((p_closing_totals->>'transfer')::numeric, 0);
  v_counted_mp := coalesce((p_closing_totals->>'mercadopago')::numeric, 0);

  update public.cash_registers
    set closed_at = now(),
        closed_by = auth.uid(),
        closing_amount = v_counted_cash,
        expected_totals = jsonb_build_object(
          'cash', round(v_expected_cash, 2),
          'card', round(v_expected_card, 2),
          'transfer', round(v_expected_transfer, 2),
          'mercadopago', round(v_expected_mp, 2),
          'pendiente_cuenta_corriente', round(coalesce(v_expected_cc_sales, 0), 2)
        ),
        closing_totals = jsonb_build_object(
          'cash', round(v_counted_cash, 2),
          'card', round(v_counted_card, 2),
          'transfer', round(v_counted_transfer, 2),
          'mercadopago', round(v_counted_mp, 2),
          'pendiente_cuenta_corriente', round(coalesce(v_expected_cc_sales, 0), 2)
        ),
        difference_totals = jsonb_build_object(
          'cash', round(v_counted_cash - v_expected_cash, 2),
          'card', round(v_counted_card - v_expected_card, 2),
          'transfer', round(v_counted_transfer - v_expected_transfer, 2),
          'mercadopago', round(v_counted_mp - v_expected_mp, 2),
          'pendiente_cuenta_corriente', 0
        ),
        notes = coalesce(nullif(p_notes, ''), notes)
  where id = p_cash_register_id
    and business_id = p_business_id
    and closed_at is null;

  if not found then
    raise exception 'cash_register_not_open';
  end if;
end;
$$;
