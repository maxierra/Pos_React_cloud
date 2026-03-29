-- Medios de pago configurables por negocio (etiqueta, ícono, activo, orden).
-- Los códigos siguen siendo los de la app: cash | card | transfer | mercadopago (caja e informes).

create table if not exists public.business_payment_methods (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  method_code text not null check (method_code in ('cash', 'card', 'transfer', 'mercadopago')),
  label text not null,
  icon_key text not null default 'banknote',
  icon_url text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, method_code)
);

create index if not exists business_payment_methods_business_sort_idx
  on public.business_payment_methods (business_id, sort_order, method_code);

alter table public.business_payment_methods enable row level security;

create policy business_payment_methods_all on public.business_payment_methods
for all
to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

-- Rellena los 4 medios por defecto si faltan (idempotente).
create or replace function public.ensure_business_payment_methods(p_business_id uuid)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if not public.is_business_member(p_business_id) then
    raise exception 'not_authorized';
  end if;

  insert into public.business_payment_methods (business_id, method_code, label, icon_key, sort_order)
  values
    (p_business_id, 'cash', 'Efectivo', 'banknote', 0),
    (p_business_id, 'card', 'Tarjeta', 'credit-card', 1),
    (p_business_id, 'transfer', 'Transferencia', 'landmark', 2),
    (p_business_id, 'mercadopago', 'Mercado Pago', 'wallet', 3)
  on conflict (business_id, method_code) do nothing;
end;
$$;

revoke all on function public.ensure_business_payment_methods(uuid) from public;
grant execute on function public.ensure_business_payment_methods(uuid) to authenticated;

-- Datos iniciales para negocios ya existentes
insert into public.business_payment_methods (business_id, method_code, label, icon_key, sort_order)
select b.id, v.method_code, v.label, v.icon_key, v.sort_order
from public.businesses b
cross join (
  values
    ('cash'::text, 'Efectivo'::text, 'banknote'::text, 0),
    ('card', 'Tarjeta', 'credit-card', 1),
    ('transfer', 'Transferencia', 'landmark', 2),
    ('mercadopago', 'Mercado Pago', 'wallet', 3)
) as v(method_code, label, icon_key, sort_order)
on conflict (business_id, method_code) do nothing;
