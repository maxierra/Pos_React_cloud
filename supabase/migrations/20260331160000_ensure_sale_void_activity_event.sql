-- Respaldo si el trigger en public.sales no registra anulaciones: log desde la app tras void_sale.

create or replace function public.ensure_sale_void_activity_event(p_sale_id uuid)
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
      and e.kind = 'sale_void'
  ) then
    return;
  end if;

  if r.status <> 'voided' then
    return;
  end if;

  v_email := public._activity_actor_email(auth.uid());
  insert into public.business_activity_events (
    business_id, user_id, kind, summary, metadata, entity_type, entity_id
  )
  values (
    r.business_id,
    auth.uid(),
    'sale_void',
    'Anuló venta · ' || to_char(coalesce(r.total, 0), 'FM999999990.00'),
    jsonb_build_object(
      'previous_total', r.total,
      'actor_email', nullif(v_email, ''),
      'source', 'ensure_void_rpc'
    ),
    'sale',
    r.id
  );
end;
$$;

revoke all on function public.ensure_sale_void_activity_event(uuid) from public;
grant execute on function public.ensure_sale_void_activity_event(uuid) to authenticated;
