-- Instaladores pagos: bucket privado. La descarga se entrega con URL firmada
-- únicamente después de validar el pedido desde el servidor.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'software-downloads',
  'software-downloads',
  false,
  1073741824,
  array['application/zip', 'application/x-zip-compressed', 'application/octet-stream']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
