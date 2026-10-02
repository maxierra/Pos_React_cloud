-- Precio público vigente del software POS: pago único de ARS 50.000.
update public.store_products
set price_ars = 50000,
    updated_at = now()
where sku = 'software_lifetime';
