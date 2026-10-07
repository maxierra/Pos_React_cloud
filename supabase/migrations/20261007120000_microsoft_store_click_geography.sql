-- Ubicación aproximada provista por la infraestructura al registrar el clic.
-- No se almacena la IP original.

alter table public.microsoft_store_click_events
  add column if not exists country_code text,
  add column if not exists region text,
  add column if not exists city text;

create index if not exists microsoft_store_click_region_created_idx
  on public.microsoft_store_click_events (region, created_at desc);

comment on column public.microsoft_store_click_events.country_code is
  'Código ISO del país estimado a partir de la IP por el proveedor de hosting.';
comment on column public.microsoft_store_click_events.region is
  'Provincia o región aproximada estimada a partir de la IP; puede ser inexacta.';
comment on column public.microsoft_store_click_events.city is
  'Ciudad aproximada estimada a partir de la IP; puede ser inexacta.';
