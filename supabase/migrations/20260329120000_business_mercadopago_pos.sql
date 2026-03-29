-- Mercado Pago QR en POS: ID de caja (público en businesses) + access token (solo servidor / service role).

alter table public.businesses
  add column if not exists mercadopago_pos_external_id text;

comment on column public.businesses.mercadopago_pos_external_id is 'external_pos_id de la caja MP (QR). Ver docs Código QR modelo dinámico.';

create table if not exists public.business_mercadopago_access (
  business_id uuid primary key references public.businesses (id) on delete cascade,
  access_token text,
  updated_at timestamptz not null default now()
);

alter table public.business_mercadopago_access enable row level security;

-- Sin políticas: los clientes autenticados no leen el token. El servidor usa service role.

create or replace function public.business_mercadopago_qr_ready (p_business_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
set row_security = off
as $$
begin
  if auth.uid() is null then
    return false;
  end if;
  if not public.is_business_member(p_business_id) then
    return false;
  end if;

  return exists (
    select 1
    from public.businesses b
    inner join public.business_mercadopago_access a on a.business_id = b.id
    where b.id = p_business_id
      and coalesce(trim(b.mercadopago_pos_external_id), '') <> ''
      and coalesce(trim(a.access_token), '') <> ''
  );
end;
$$;

revoke all on function public.business_mercadopago_qr_ready (uuid) from public;
grant execute on function public.business_mercadopago_qr_ready (uuid) to authenticated;
