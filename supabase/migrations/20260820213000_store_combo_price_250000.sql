-- Alinear catálogo y checkout del combo con el precio comercial vigente.
update public.store_products
set
  name = 'Combo Punto de Venta',
  price_ars = 250000,
  updated_at = now()
where sku = 'combo_essential';
