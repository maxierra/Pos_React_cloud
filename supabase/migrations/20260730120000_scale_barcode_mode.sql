alter table public.businesses
  add column if not exists scale_barcode_mode text not null default 'weight'
  check (scale_barcode_mode in ('weight', 'price', 'both'));
