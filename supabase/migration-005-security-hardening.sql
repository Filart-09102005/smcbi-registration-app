-- Migration 005: security hardening
--
-- From a full security audit of the registration flow. Two independent
-- fixes, both defense against a malicious or scripted client - not just a
-- careless one - since RLS already stops non-admins from reading data, but
-- nothing stopped an attacker from writing unlimited or oversized rows.
--
-- Safe to re-run. Does not touch existing rows.

-- 1. Length caps on free-text columns ----------------------------------------
-- text has no length limit in Postgres by default. Nothing stopped a
-- request from submitting a multi-megabyte string as a name or email -
-- cheap storage-exhaustion / slow-query abuse for an attacker, free of any
-- CAPTCHA or rate limit, since it's a single request either way. Limits are
-- generous enough that no real name/email/School ID is ever affected.
alter table public.student_registrations
  drop constraint if exists student_registrations_firstname_length,
  drop constraint if exists student_registrations_lastname_length,
  drop constraint if exists student_registrations_email_length,
  drop constraint if exists student_registrations_barcode_length;

alter table public.student_registrations
  add constraint student_registrations_firstname_length check (char_length(firstname) <= 100),
  add constraint student_registrations_lastname_length check (char_length(lastname) <= 100),
  add constraint student_registrations_email_length check (char_length(email) <= 255),
  add constraint student_registrations_barcode_length check (char_length(barcode) <= 50);

-- 2. Registration rate limiting ------------------------------------------------
-- Nothing before this stopped a script from submitting thousands of
-- registrations - Supabase's PostgREST does not throttle table inserts by
-- IP on its own, and the app has no server component to do it in. This
-- enforces a per-IP limit at the one place every insert must pass through
-- regardless of what client sent it: the database itself.
--
-- The IP comes from the 'x-forwarded-for' request header, which PostgREST
-- exposes to Postgres as a GUC when a request comes through Supabase's API
-- (not available for direct SQL-editor inserts, which is fine - those are
-- already trusted). The attempts table holds only IP + timestamp, nothing
-- about who was trying to register.

create table if not exists public.registration_attempts (
  id bigserial primary key,
  ip_address text not null,
  attempted_at timestamptz not null default now()
);

create index if not exists registration_attempts_ip_time_idx
  on public.registration_attempts (ip_address, attempted_at);

-- Nobody gets a policy here at all - not even admins. This table is written
-- to by the trigger function below (security definer, so it bypasses RLS on
-- its own), and read by nothing. RLS with zero policies means the default
-- deny applies to every direct client request, select included.
alter table public.registration_attempts enable row level security;

-- Old attempt rows are worthless after the rate-limit window passes: this
-- keeps the table from growing forever. Runs probabilistically (1-in-20
-- inserts) rather than on every single insert, so it doesn't add a delete
-- query's cost to every registration.
create or replace function public.prune_registration_attempts()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.registration_attempts where attempted_at < now() - interval '24 hours';
$$;

create or replace function public.enforce_registration_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  client_ip text;
  recent_count integer;
  max_attempts constant integer := 5;
  window_minutes constant integer := 60;
begin
  begin
    client_ip := split_part(
      coalesce(current_setting('request.headers', true)::json ->> 'x-forwarded-for', 'unknown'),
      ',', 1
    );
  exception when others then
    client_ip := 'unknown';
  end;

  select count(*) into recent_count
  from public.registration_attempts
  where ip_address = client_ip
    and attempted_at > now() - (window_minutes || ' minutes')::interval;

  if recent_count >= max_attempts then
    raise exception 'Too many registration attempts from this network. Please try again later.'
      using errcode = 'P0001';
  end if;

  insert into public.registration_attempts (ip_address) values (client_ip);

  if random() < 0.05 then
    perform public.prune_registration_attempts();
  end if;

  return new;
end;
$$;

drop trigger if exists trg_registration_rate_limit on public.student_registrations;

create trigger trg_registration_rate_limit
  before insert on public.student_registrations
  for each row
  execute function public.enforce_registration_rate_limit();
