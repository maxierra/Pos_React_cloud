-- DEPRECADO: preferí 20250325130000_platform_settings_trial_interval.sql (incluye trial configurable).
-- Si ya corriste este archivo, igual podés correr el 20250325 para platform_settings.

create or replace function public.create_business_with_owner(
  p_name text,
  p_slug text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  insert into public.businesses (name, slug)
  values (p_name, p_slug)
  returning id into v_business_id;

  insert into public.memberships (business_id, user_id, role)
  values (v_business_id, auth.uid(), 'owner');

  insert into public.subscriptions (
    business_id,
    plan_id,
    status,
    current_period_start,
    current_period_end,
    provider
  )
  values (
    v_business_id,
    'standard',
    'trialing',
    now(),
    now() + interval '3 days',
    'mercadopago'
  );

  return v_business_id;
end;
$$;
