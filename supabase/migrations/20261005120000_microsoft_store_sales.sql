-- Ventas atribuidas manualmente a los clics de Microsoft Store.
create table if not exists public.microsoft_store_sales (
  id uuid primary key default gen_random_uuid(),
  sale_date date not null,
  quantity integer not null default 1,
  total_amount numeric(12, 2) not null,
  note text,
  created_at timestamptz not null default now(),
  constraint microsoft_store_sales_quantity_check check (quantity > 0),
  constraint microsoft_store_sales_total_amount_check check (total_amount >= 0),
  constraint microsoft_store_sales_note_check check (char_length(note) <= 300)
);
create index if not exists microsoft_store_sales_date_idx on public.microsoft_store_sales (sale_date desc, created_at desc);
alter table public.microsoft_store_sales enable row level security;
comment on table public.microsoft_store_sales is 'Ventas cargadas manualmente por administradores y atribuidas al seguimiento de Microsoft Store.';
comment on column public.microsoft_store_sales.total_amount is 'Precio unitario en ARS conservado con este nombre por compatibilidad.';
