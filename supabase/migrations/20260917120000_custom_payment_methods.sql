-- Permite que cada comercio agregue medios de pago propios desde Configuración.
-- Los cinco códigos conocidos siguen siendo creados por ensure_business_payment_methods.

alter table public.business_payment_methods
  drop constraint if exists business_payment_methods_method_code_check;

alter table public.business_payment_methods
  drop constraint if exists business_payment_methods_method_code_format_check;

alter table public.business_payment_methods
  add constraint business_payment_methods_method_code_format_check
  check (method_code ~ '^[a-z0-9][a-z0-9_]{0,39}$');

notify pgrst, 'reload schema';
