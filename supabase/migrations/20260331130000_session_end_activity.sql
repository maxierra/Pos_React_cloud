-- Cierre de sesión en el registro de actividad (llamar desde la app antes de signOut).

create or replace function public.record_session_end(p_business_id uuid)
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
    'session_end',
    'Cierre de sesión',
    '{}'::jsonb
  );
end;
$$;

revoke all on function public.record_session_end(uuid) from public;
grant execute on function public.record_session_end(uuid) to authenticated;
