-- Respaldo si el trigger sales_activity_log_trigger no está aplicado: registra la venta en el log desde la app tras el cobro.

create or replace function public.ensure_sale_activity_event(p_sale_id uuid)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  r public.sales%rowtype;
  v_email text;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select * into r from public.sales where id = p_sale_id;
  if not found then
    raise exception 'sale_not_found';
  end if;

  if not public.is_business_member(r.business_id) then
    raise exception 'not_authorized';
  end if;

  if exists (
    select 1 from public.business_activity_events e
    where e.entity_id = p_sale_id
      and e.kind = 'sale'
  ) then
    return;
  end if;

  if r.status <> 'paid' or coalesce(r.total, 0) <= 0 then
    return;
  end if;

  v_email := public._activity_actor_email(r.cashier_user_id);
  insert into public.business_activity_events (
    business_id, user_id, kind, summary, metadata, entity_type, entity_id
  )
  values (
    r.business_id,
    r.cashier_user_id,
    'sale',
    'Venta · ' || to_char(r.total, 'FM999999990.00') || ' · ' || coalesce(r.payment_method, ''),
    jsonb_build_object(
      'total', r.total,
      'payment_method', r.payment_method,
      'cashier_email', nullif(v_email, ''),
      'source', 'ensure_rpc'
    ),
    'sale',
    r.id
  );
end;
$$;

revoke all on function public.ensure_sale_activity_event(uuid) from public;
grant execute on function public.ensure_sale_activity_event(uuid) to authenticated;
