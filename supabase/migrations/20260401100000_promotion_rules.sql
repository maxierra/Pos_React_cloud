-- Reglas de promociones y descuentos por negocio.

create table if not exists public.promotion_rules (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,

  -- ticket_amount: por monto total del ticket
  -- ticket_quantity: por cantidad total de unidades del ticket
  -- product_quantity: por cantidad de un producto específico
  kind text not null check (kind in ('ticket_amount', 'ticket_quantity', 'product_quantity')),

  name text not null,
  priority int not null default 10,

  discount_percent numeric(6,2) not null check (discount_percent >= 0 and discount_percent <= 100),

  -- Códigos de medios de pago (cash | card | transfer | mercadopago | cuenta_corriente, etc.)
  payment_methods text[] default null,

  active boolean not null default true,

  valid_from timestamptz,
  valid_until timestamptz,

  -- ticket_amount
  amount_min numeric(12,2),
  amount_max numeric(12,2),

  -- ticket_quantity / product_quantity
  quantity_min int,

  -- product_quantity
  product_id uuid references public.products(id) on delete cascade,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists promotion_rules_business_kind_active_idx
  on public.promotion_rules (business_id, kind, active, priority);

alter table public.promotion_rules enable row level security;

create policy promotion_rules_all on public.promotion_rules
for all
to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

-- Mantener updated_at al día.
create or replace function public.promotion_rules_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists promotion_rules_set_updated_at on public.promotion_rules;
create trigger promotion_rules_set_updated_at
before update on public.promotion_rules
for each row
execute procedure public.promotion_rules_set_updated_at();

