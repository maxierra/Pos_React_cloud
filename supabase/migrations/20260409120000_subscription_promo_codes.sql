-- Códigos de descuento para suscripción (ej. bono de bienvenida generado desde admin).
-- El código se guarda normalizado (mayúsculas, sin espacios). Sin políticas RLS para el rol anon/authenticated.

create table if not exists public.subscription_promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  business_id uuid not null references public.businesses (id) on delete cascade,
  discount_percent numeric(5, 2) not null check (discount_percent > 0 and discount_percent <= 100),
  plan_key text not null check (plan_key in ('monthly', 'semester', 'annual')),
  expires_at timestamptz null,
  used_at timestamptz null,
  note text null,
  created_at timestamptz not null default now()
);

create index if not exists subscription_promo_codes_business_id_idx
  on public.subscription_promo_codes (business_id);

alter table public.subscription_promo_codes enable row level security;

comment on table public.subscription_promo_codes is
  'Descuentos de suscripción MP; checkout valida código + negocio; webhook marca used_at.';
