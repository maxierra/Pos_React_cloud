-- Recargo configurable exclusivamente para pagos directos con tarjeta.
-- El trigger calcula el importe en la base para que el total no dependa del cliente web.

alter table public.business_payment_methods
  add column if not exists surcharge_percent numeric(5,2) not null default 0;

alter table public.business_payment_methods
  drop constraint if exists business_payment_methods_surcharge_percent_check;

alter table public.business_payment_methods
  add constraint business_payment_methods_surcharge_percent_check
  check (
    surcharge_percent >= 0
    and surcharge_percent <= 100
    and (method_code = 'card' or surcharge_percent = 0)
  );

create or replace function public.apply_card_surcharge_to_sale()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_percent numeric(5,2) := 0;
  v_amount numeric(12,2) := 0;
  v_base numeric(12,2) := 0;
begin
  -- create_sale_with_items inserta la venta con total 0 y luego fija el total neto.
  -- Solo intervenimos en esa primera finalización para evitar aplicar dos veces el recargo.
  if new.payment_method <> 'card'
     or new.status <> 'paid'
     or coalesce(old.total, 0) <> 0
     or coalesce(new.total, 0) <= 0 then
    return new;
  end if;

  select coalesce(pm.surcharge_percent, 0)
    into v_percent
  from public.business_payment_methods pm
  where pm.business_id = new.business_id
    and pm.method_code = 'card'
  limit 1;

  v_percent := least(100, greatest(0, coalesce(v_percent, 0)));
  if v_percent <= 0 then
    return new;
  end if;

  v_base := round(new.total::numeric, 2);
  v_amount := round((v_base * v_percent / 100)::numeric, 2);
  new.total := v_base + v_amount;
  new.payment_details := jsonb_set(
    coalesce(new.payment_details, '{}'::jsonb),
    '{surcharge}',
    jsonb_build_object(
      'method', 'card',
      'percent', v_percent,
      'amount', v_amount,
      'base_amount', v_base
    ),
    true
  );

  return new;
end;
$$;

drop trigger if exists sales_apply_card_surcharge on public.sales;
create trigger sales_apply_card_surcharge
before update of total on public.sales
for each row
execute function public.apply_card_surcharge_to_sale();

notify pgrst, 'reload schema';
