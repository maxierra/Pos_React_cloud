alter table public.business_fiscal_config
  add column if not exists document_output_mode text not null default 'factura'
  check (document_output_mode in ('ticket', 'factura'));

comment on column public.business_fiscal_config.document_output_mode is
  'Preferencia visual del negocio para mostrar comprobantes en POS: ticket o factura.';
