alter table public.download_events
  add column if not exists activation_code text;

comment on column public.download_events.activation_code is 'Código de licencia entregado al cliente.';
