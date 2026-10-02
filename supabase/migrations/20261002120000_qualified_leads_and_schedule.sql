create table if not exists public.qualified_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  full_name text not null check (char_length(full_name) between 2 and 100),
  whatsapp text not null check (char_length(whatsapp) between 10 and 15),
  locality text not null check (char_length(locality) between 2 and 100),
  business_type text not null,
  pc_status text not null check (pc_status in ('windows','no_pc','unsure')),
  reader_status text not null check (reader_status in ('yes','no','want_one')),
  intent text not null check (intent in ('implement','replace','learn','browsing')),
  score smallint not null,
  classification text not null check (classification in ('ALTA INTENCIÓN','MEDIA INTENCIÓN','BAJA INTENCIÓN')),
  status text not null default 'NUEVO' check (status in ('NUEVO','CALIFICADO','AGENDADO','CONTACTADO','INSTALADO','EN PRUEBA','ACTIVADO','NO INTERESADO','NO SE PRESENTÓ')),
  contact_consent_at timestamptz not null,
  scheduled_at timestamptz,
  utm_source text, utm_medium text, utm_campaign text, utm_content text, utm_term text,
  landing_url text, referrer text, admin_note text
);

create unique index if not exists qualified_leads_scheduled_slot_unique
  on public.qualified_leads (scheduled_at) where scheduled_at is not null;
create index if not exists qualified_leads_created_idx on public.qualified_leads (created_at desc);
create index if not exists qualified_leads_classification_idx on public.qualified_leads (classification, created_at desc);
create index if not exists qualified_leads_status_idx on public.qualified_leads (status, created_at desc);
alter table public.qualified_leads enable row level security;
drop policy if exists qualified_leads_no_public_access on public.qualified_leads;
create policy qualified_leads_no_public_access on public.qualified_leads for select using (false);
comment on table public.qualified_leads is 'Leads calificados de la landing y sus turnos de demostración/instalación.';
notify pgrst, 'reload schema';

