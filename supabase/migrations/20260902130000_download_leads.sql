-- Convierte los eventos de descarga en leads identificables y permite su seguimiento comercial.

alter table public.download_events
  add column if not exists full_name text,
  add column if not exists phone text,
  add column if not exists activation_requested boolean not null default false,
  add column if not exists activation_requested_at timestamptz,
  add column if not exists contact_consent_at timestamptz,
  add column if not exists admin_note text;

create index if not exists download_events_phone_created_idx
  on public.download_events (phone, created_at desc)
  where phone is not null;

create index if not exists download_events_activation_requested_idx
  on public.download_events (activation_requested, created_at desc);

comment on column public.download_events.full_name is 'Nombre completo informado antes de descargar el instalador.';
comment on column public.download_events.phone is 'Teléfono informado antes de descargar, normalizado para búsqueda.';
comment on column public.download_events.activation_requested is 'Marca comercial: el contacto pidió una clave de activación.';
comment on column public.download_events.contact_consent_at is 'Momento en que la persona aceptó ser contactada por su prueba y activación.';
comment on column public.download_events.admin_note is 'Nota interna del administrador sobre el seguimiento del contacto.';
