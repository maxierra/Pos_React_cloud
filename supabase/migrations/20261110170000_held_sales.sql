-- Carritos pausados del POS. No son ventas: no afectan stock, caja ni ARCA.
create table if not exists public.held_sales (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  cashier_user_id uuid references auth.users(id) on delete set null,
  label text not null,
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) > 0),
  total_snapshot numeric(12,2) not null default 0 check (total_snapshot >= 0),
  payment_method text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists held_sales_business_created_idx
  on public.held_sales(business_id, created_at desc);

alter table public.held_sales enable row level security;

drop policy if exists held_sales_all on public.held_sales;
create policy held_sales_all on public.held_sales
for all to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

grant select, insert, update, delete on public.held_sales to authenticated;
