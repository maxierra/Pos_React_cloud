-- Devuelve los saldos de cuenta corriente de todos los clientes de un comercio
-- en una sola consulta agregada. Evita descargar miles de ventas al POS.
create or replace function public.business_customer_balances(p_business_id uuid)
returns table (
  customer_id uuid,
  balance numeric
)
language plpgsql
stable
security definer
set search_path = public
set row_security = off
as $$
begin
  if not public.is_business_member(p_business_id) then
    raise exception 'not_authorized';
  end if;

  return query
  with sale_charges as (
    select
      s.customer_id,
      sum(
        case
          when s.payment_method = 'cuenta_corriente' then s.total
          when s.payment_method = 'mixed' then coalesce((
            select sum(coalesce((part->>'amount')::numeric, 0))
            from jsonb_array_elements(coalesce(s.payment_details->'split', '[]'::jsonb)) part
            where part->>'method' = 'cuenta_corriente'
          ), 0)
          else 0
        end
      ) as amount
    from public.sales s
    where s.business_id = p_business_id
      and s.customer_id is not null
      and s.status = 'paid'
    group by s.customer_id
  ),
  account_payments as (
    select
      p.customer_id,
      sum(p.amount) as amount
    from public.customer_account_payments p
    where p.business_id = p_business_id
    group by p.customer_id
  )
  select
    c.id as customer_id,
    round(coalesce(sc.amount, 0) - coalesce(ap.amount, 0), 2) as balance
  from public.business_customers c
  left join sale_charges sc on sc.customer_id = c.id
  left join account_payments ap on ap.customer_id = c.id
  where c.business_id = p_business_id;
end;
$$;

revoke all on function public.business_customer_balances(uuid) from public;
grant execute on function public.business_customer_balances(uuid) to authenticated, service_role;
