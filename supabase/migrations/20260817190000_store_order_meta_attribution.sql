alter table public.store_orders
  add column if not exists meta_fbp text,
  add column if not exists meta_fbc text,
  add column if not exists client_ip text,
  add column if not exists client_user_agent text,
  add column if not exists meta_purchase_sent_at timestamptz;

comment on column public.store_orders.meta_fbp is 'Meta browser identifier captured at checkout';
comment on column public.store_orders.meta_fbc is 'Meta click identifier captured at checkout';
comment on column public.store_orders.meta_purchase_sent_at is 'Purchase successfully accepted by Meta Conversions API';
