-- Alertas por correo a administradores (registros y pagos de suscripción MP).
-- Destino y toggles se configuran en /admin/alertas.

alter table public.platform_settings
  add column if not exists admin_alert_email text,
  add column if not exists alert_on_user_signup boolean not null default false,
  add column if not exists alert_on_subscription_payment boolean not null default false;

comment on column public.platform_settings.admin_alert_email is 'Correo donde recibir alertas de plataforma (si vacío, se usa el primer mail de PLATFORM_ADMIN_EMAILS).';
comment on column public.platform_settings.alert_on_user_signup is 'Enviar mail cuando un usuario crea cuenta (sign up).';
comment on column public.platform_settings.alert_on_subscription_payment is 'Enviar mail cuando Mercado Pago acredita un pago de suscripción.';
