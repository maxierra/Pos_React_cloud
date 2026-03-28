-- Duración del trial configurable (una fila global). Ver supabase/SUBSCRIPTION_TRIAL.md

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

  select coalesce(
    (select subscription_trial_interval from public.platform_settings where id = 1),
    interval '3 days'
  )
  into v_trial;

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
