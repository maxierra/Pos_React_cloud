-- Permite medir los CTA actuales de demo y compra por ubicación en la landing.

alter table public.microsoft_store_click_events
  drop constraint if exists microsoft_store_click_location_check;

alter table public.microsoft_store_click_events
  add constraint microsoft_store_click_location_check check (
    location in ('header', 'hero', 'hero_certificate', 'store_band', 'mobile_share', 'final', 'mobile_bar')
  );

alter table public.mercadolibre_click_events
  drop constraint if exists mercadolibre_click_location_check;

alter table public.mercadolibre_click_events
  add constraint mercadolibre_click_location_check check (
    location in ('hero', 'price', 'final')
  );
