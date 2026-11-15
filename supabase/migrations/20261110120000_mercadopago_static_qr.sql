-- QR fijo de Mercado Pago asociado a la caja. Las URLs son públicas y no contienen credenciales.
alter table public.businesses
  add column if not exists mercadopago_pos_numeric_id bigint,
  add column if not exists mercadopago_qr_image_url text,
  add column if not exists mercadopago_qr_template_image_url text,
  add column if not exists mercadopago_qr_template_document_url text,
  add column if not exists mercadopago_qr_code text;

comment on column public.businesses.mercadopago_qr_template_document_url is
  'PDF imprimible del QR fijo devuelto por Mercado Pago al crear la caja /v2/pos.';
