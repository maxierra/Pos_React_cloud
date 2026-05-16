-- Negocios sin fila en subscriptions (alta manual en DB, datos viejos, etc.): crea trial con el intervalo actual de platform_settings.
-- Ver supabase/SUBSCRIPTION_TRIAL.md

create or replace function public.ensure_subscription_trial_for_business(p_business_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trial interval;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if not public.is_business_member(p_business_id) then
    raise exception 'not_authorized';
  end if;

  if exists (select 1 from public.subscriptions s where s.business_id = p_business_id) then
    return;
  end if;

  begin
    select subscription_trial_interval into v_trial from public.platform_settings where id = 1;
    v_trial := coalesce(v_trial, interval '3 days');
  exception
    when sqlstate '42P01' then
      v_trial := interval '3 days';
  end;

  insert into public.subscriptions (
    business_id,
    plan_id,
    status,
    current_period_start,
    current_period_end,
    provider
  )
  values (
    p_business_id,
    'standard',
    'trialing',
    now(),
    now() + v_trial,
    'mercadopago'
  );
end;
$$;

revoke all on function public.ensure_subscription_trial_for_business(uuid) from public;
grant execute on function public.ensure_subscription_trial_for_business(uuid) to authenticated;
