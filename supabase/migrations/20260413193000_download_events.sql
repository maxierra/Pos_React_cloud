-- Tracking de descargas del instalador desktop desde la landing.

create table if not exists public.download_events (
  id uuid primary key default gen_random_uuid(),
  asset_key text not null,
  source text not null default 'landing',
  user_agent text,
  referer text,
  ip_hash text,
  created_at timestamptz not null default now()
);

create index if not exists download_events_asset_created_idx
  on public.download_events (asset_key, created_at desc);

create index if not exists download_events_created_idx
  on public.download_events (created_at desc);

alter table public.download_events enable row level security;

comment on table public.download_events is 'Eventos de descarga iniciados desde la web (antes de redirigir al archivo final).';
comment on column public.download_events.asset_key is 'Identificador lógico del binario/asset descargado.';
comment on column public.download_events.source is 'Origen del clic (landing, admin, campaña, etc.).';
comment on column public.download_events.ip_hash is 'Hash SHA-256 de IP para deduplicación aproximada sin guardar IP plana.';
