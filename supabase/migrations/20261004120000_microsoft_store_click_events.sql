-- Registra salidas anónimas desde la landing hacia Microsoft Store.

create table if not exists public.microsoft_store_click_events (
  id uuid primary key default gen_random_uuid(),
  location text not null,
  device text not null default 'desktop',
  user_agent text,
  referer text,
  ip_hash text,
  created_at timestamptz not null default now(),
  constraint microsoft_store_click_location_check check (
    location in ('header', 'hero', 'hero_certificate', 'store_band', 'mobile_share')
  ),
  constraint microsoft_store_click_device_check check (device in ('desktop', 'mobile'))
);

create index if not exists microsoft_store_click_created_idx
  on public.microsoft_store_click_events (created_at desc);

create index if not exists microsoft_store_click_location_created_idx
  on public.microsoft_store_click_events (location, created_at desc);

alter table public.microsoft_store_click_events enable row level security;

comment on table public.microsoft_store_click_events is
  'Clics anónimos que salieron de Tienda360 hacia Microsoft Store; no confirman una instalación.';
comment on column public.microsoft_store_click_events.location is
  'Ubicación del enlace en la landing.';
comment on column public.microsoft_store_click_events.ip_hash is
  'Hash SHA-256 de IP para análisis aproximado sin conservar la IP plana.';
