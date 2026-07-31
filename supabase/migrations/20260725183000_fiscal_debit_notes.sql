alter table public.fiscal_voucher_links
  add column if not exists debit_note_id uuid references public.fiscal_vouchers(id) on delete cascade;

create unique index if not exists fiscal_voucher_links_debit_note_uidx
  on public.fiscal_voucher_links(debit_note_id)
  where debit_note_id is not null;

drop policy if exists fiscal_voucher_links_all on public.fiscal_voucher_links;
create policy fiscal_voucher_links_all on public.fiscal_voucher_links
  for select to authenticated
  using (
    exists (
      select 1
      from public.fiscal_vouchers v
      where v.id = coalesce(credit_note_id, debit_note_id)
        and public.is_business_member(v.business_id)
    )
  );
