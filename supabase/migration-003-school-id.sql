-- Migration 003: School ID / barcode field
--
-- Adds the field students type their existing school ID into during
-- registration. It doubles as the kiosk barcode - the whole point is that
-- the number they type online is the same one already printed as a barcode
-- on their physical school ID, so scanning that card at the kiosk lines up
-- with what they registered here, instead of the kiosk generating an
-- unrelated barcode for them later.
--
-- Nullable at the database level (not enforced NOT NULL) so this doesn't
-- break rows submitted before this field existed - the frontend requires it
-- for every new submission going forward, which is where it actually
-- matters. Safe to re-run.

alter table public.student_registrations
  add column if not exists barcode text;

-- Partial unique index: two real barcodes can never collide, but any number
-- of legacy rows are allowed to share a null barcode.
create unique index if not exists student_registrations_barcode_key
  on public.student_registrations (barcode)
  where barcode is not null;

create or replace function public.check_barcode_exists(p_barcode text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.student_registrations
    where barcode = p_barcode
  );
$$;

revoke all on function public.check_barcode_exists(text) from public;
grant execute on function public.check_barcode_exists(text) to anon, authenticated;
