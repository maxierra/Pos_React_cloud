update public.store_products
set price_ars = 75000,
    updated_at = now()
where sku = 'software_lifetime';

create table if not exists public.combo_reservations (
  id uuid primary key default gen_random_uuid(),
  combo_sku text not null,
  combo_title text not null,
  customer_name text not null,
  phone text not null,
  shipping_address text not null,
  payment_method text not null
    check (payment_method in ('mercadopago', 'transferencia', 'efectivo', 'a_coordinar')),
  status text not null default 'pending'
    check (status in ('pending', 'contacted', 'closed')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists combo_reservations_created_idx
  on public.combo_reservations (created_at desc);

create index if not exists combo_reservations_status_idx
  on public.combo_reservations (status, created_at desc);

alter table public.combo_reservations enable row level security;

drop policy if exists combo_reservations_no_public_access on public.combo_reservations;
create policy combo_reservations_no_public_access on public.combo_reservations
  for select using (false);
