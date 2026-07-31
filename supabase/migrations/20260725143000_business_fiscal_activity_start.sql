alter table public.business_fiscal_config
  add column if not exists activity_start_date date;
