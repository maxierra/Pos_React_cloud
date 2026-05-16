-- Corrige proyectos donde nunca existió platform_settings: sin esta tabla, create_business_with_owner fallaba
-- y el negocio podía quedar sin fila en subscriptions (o el RPC no completaba el alta).
-- Ejecutá este archivo completo en Supabase → SQL Editor.

create table if not exists public.platform_settings (
  id smallint primary key default 1 check (id = 1),
  subscription_trial_interval interval not null default interval '3 days',
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (id, subscription_trial_interval)
values (1, interval '3 days')
on conflict (id) do nothing;

alter table public.platform_settings enable row level security;

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
  v_trial interval;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  begin
    select subscription_trial_interval into v_trial from public.platform_settings where id = 1;
    v_trial := coalesce(v_trial, interval '3 days');
  exception
    when sqlstate '42P01' then
      v_trial := interval '3 days';
  end;

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
    now() + v_trial,
    'mercadopago'
  );

  return v_business_id;
end;
$$;

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

revoke all on function public.create_business_with_owner(text, text) from public;
grant execute on function public.create_business_with_owner(text, text) to authenticated;

revoke all on function public.ensure_subscription_trial_for_business(uuid) from public;
grant execute on function public.ensure_subscription_trial_for_business(uuid) to authenticated;
