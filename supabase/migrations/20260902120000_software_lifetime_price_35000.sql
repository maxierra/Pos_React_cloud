-- Precio público vigente del software POS: pago único de ARS 35.000.
update public.store_products
set price_ars = 35000,
    updated_at = now()
where sku = 'software_lifetime';

alter table public.store_orders
  add column if not exists download_event_id uuid references public.download_events(id) on delete set null;

create index if not exists store_orders_download_event_idx
  on public.store_orders (download_event_id)
  where download_event_id is not null;

comment on column public.store_orders.download_event_id is
  'Descarga anónima previa atribuida al pedido para medir conversión descarga a pago.';
