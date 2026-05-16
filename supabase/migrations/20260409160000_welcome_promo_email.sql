-- Código de bienvenida: se genera al crear el primer negocio y se envía por mail (Resend), configurable en /admin/alertas.

alter table public.platform_settings
  add column if not exists welcome_promo_enabled boolean not null default false,
  add column if not exists welcome_promo_discount_percent numeric(5, 2) not null default 50
    check (welcome_promo_discount_percent > 0 and welcome_promo_discount_percent <= 100),
  add column if not exists welcome_promo_plan_key text not null default 'monthly'
    check (welcome_promo_plan_key in ('monthly', 'semester', 'annual'));

comment on column public.platform_settings.welcome_promo_enabled is 'Si true, al crear el primer negocio se genera un código de descuento y se envía al usuario por correo (Resend).';
comment on column public.platform_settings.welcome_promo_discount_percent is 'Porcentaje de descuento del código de bienvenida.';
comment on column public.platform_settings.welcome_promo_plan_key is 'Plan al que aplica el código (monthly | semester | annual).';
