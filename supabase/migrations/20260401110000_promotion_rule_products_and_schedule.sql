-- Productos asociados a una promoción (permite asignar varias referencias).

create table if not exists public.promotion_rule_products (
  promotion_id uuid not null references public.promotion_rules(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  primary key (promotion_id, product_id)
);

alter table public.promotion_rule_products enable row level security;

create policy promotion_rule_products_all on public.promotion_rule_products
for all
to authenticated
using (
  exists (
    select 1
    from public.promotion_rules r
    where r.id = promotion_id
      and public.is_business_member(r.business_id)
  )
)
with check (
  exists (
    select 1
    from public.promotion_rules r
    where r.id = promotion_id
      and public.is_business_member(r.business_id)
  )
);

-- Días de la semana y horario opcional para acotar cuándo aplica la promo.

alter table public.promotion_rules
  add column if not exists days_of_week text[] default null,
  add column if not exists time_start time,
  add column if not exists time_end time;

