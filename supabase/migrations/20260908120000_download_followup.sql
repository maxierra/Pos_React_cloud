alter table public.download_events
  add column if not exists contacted_at timestamptz,
  add column if not exists contact_channel text,
  add column if not exists activation_paid_at timestamptz,
  add column if not exists reminder_sent_at timestamptz;
