-- Registra salidas anónimas desde la landing hacia Mercado Libre.

create table if not exists public.mercadolibre_click_events (
  id uuid primary key default gen_random_uuid(),
  location text not null,
  device text not null default 'desktop',
  user_agent text,
  referer text,
  ip_hash text,
  country_code text,
  region text,
  city text,
  created_at timestamptz not null default now(),
  constraint mercadolibre_click_location_check check (location in ('hero')),
  constraint mercadolibre_click_device_check check (device in ('desktop', 'mobile'))
);

create index if not exists mercadolibre_click_created_idx
  on public.mercadolibre_click_events (created_at desc);

create index if not exists mercadolibre_click_location_created_idx
  on public.mercadolibre_click_events (location, created_at desc);

alter table public.mercadolibre_click_events enable row level security;

comment on table public.mercadolibre_click_events is
  'Clics anónimos que salieron de Tienda360 hacia Mercado Libre; no confirman una compra.';
comment on column public.mercadolibre_click_events.ip_hash is
  'Hash SHA-256 de IP para análisis aproximado sin conservar la IP original.';
