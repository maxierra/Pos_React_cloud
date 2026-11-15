-- Ajustes de precio configurables para cualquier medio de pago.
-- Positivo = recargo; negativo = descuento. El cálculo final vive en la DB.

alter table public.business_payment_methods
  drop constraint if exists business_payment_methods_surcharge_percent_check;

alter table public.business_payment_methods
  add constraint business_payment_methods_surcharge_percent_check
  check (surcharge_percent >= -100 and surcharge_percent <= 100);

create or replace function public.apply_payment_adjustment_to_sale()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_percent numeric(5,2) := 0;
  v_adjustment numeric(12,2) := 0;
  v_base numeric(12,2) := 0;
  v_split_base numeric(12,2) := 0;
  v_scale numeric := 1;
  v_part jsonb;
  v_part_method text;
  v_part_original numeric(12,2);
  v_part_base numeric(12,2);
  v_part_adjustment numeric(12,2);
  v_adjusted_split jsonb := '[]'::jsonb;
  v_parts jsonb := '[]'::jsonb;
begin
  if new.status <> 'paid'
     or coalesce(old.total, 0) <> 0
     or coalesce(new.total, 0) <= 0 then
    return new;
  end if;

  v_base := round(new.total::numeric, 2);

  if new.payment_method = 'mixed' then
    select coalesce(sum(greatest(0, coalesce((part->>'amount')::numeric, 0))), 0)
      into v_split_base
    from jsonb_array_elements(coalesce(new.payment_details->'split', '[]'::jsonb)) part;

    if v_split_base <= 0 then
      return new;
    end if;
    v_scale := v_base / v_split_base;

    for v_part in select value from jsonb_array_elements(coalesce(new.payment_details->'split', '[]'::jsonb))
    loop
      v_part_method := coalesce(v_part->>'method', '');
      v_part_original := greatest(0, coalesce((v_part->>'amount')::numeric, 0));
      v_part_base := round(v_part_original * v_scale, 2);

      v_percent := 0;
      select coalesce(pm.surcharge_percent, 0)
        into v_percent
      from public.business_payment_methods pm
      where pm.business_id = new.business_id and pm.method_code = v_part_method
      limit 1;
      v_percent := least(100, greatest(-100, coalesce(v_percent, 0)));
      v_part_adjustment := round(v_part_base * v_percent / 100, 2);
      v_adjustment := v_adjustment + v_part_adjustment;

      v_adjusted_split := v_adjusted_split || jsonb_build_array(
        jsonb_build_object('method', v_part_method, 'amount', v_part_base + v_part_adjustment)
      );
      v_parts := v_parts || jsonb_build_array(
        jsonb_build_object('method', v_part_method, 'percent', v_percent, 'base_amount', v_part_base, 'amount', v_part_adjustment)
      );
    end loop;

    new.payment_details := jsonb_set(coalesce(new.payment_details, '{}'::jsonb), '{split}', v_adjusted_split, true);
  else
    select coalesce(pm.surcharge_percent, 0)
      into v_percent
    from public.business_payment_methods pm
    where pm.business_id = new.business_id and pm.method_code = new.payment_method
    limit 1;
    v_percent := least(100, greatest(-100, coalesce(v_percent, 0)));
    v_adjustment := round(v_base * v_percent / 100, 2);
    v_parts := jsonb_build_array(
      jsonb_build_object('method', new.payment_method, 'percent', v_percent, 'base_amount', v_base, 'amount', v_adjustment)
    );
  end if;

  if v_adjustment <> 0 then
    new.total := v_base + v_adjustment;
    new.payment_details := jsonb_set(
      coalesce(new.payment_details, '{}'::jsonb),
      '{price_adjustment}',
      jsonb_build_object(
        'method', new.payment_method,
        'percent', case when new.payment_method = 'mixed' then null else v_percent end,
        'amount', v_adjustment,
        'base_amount', v_base,
        'parts', v_parts
      ),
      true
    );
  end if;

  return new;
end;
$$;

drop trigger if exists sales_apply_card_surcharge on public.sales;
drop trigger if exists sales_apply_payment_adjustment on public.sales;
create trigger sales_apply_payment_adjustment
before update of total on public.sales
for each row
execute function public.apply_payment_adjustment_to_sale();

drop function if exists public.apply_card_surcharge_to_sale();

notify pgrst, 'reload schema';
