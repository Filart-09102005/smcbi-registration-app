-- SMCBI Student Pre-Registration Portal
-- Run this in the Supabase SQL editor (Project -> SQL Editor -> New query).
--
-- This is the source of truth for a FRESH project. If your project already
-- has this table, do not re-run this file - run
-- supabase/migration-002-personnel-and-admin.sql instead, which upgrades an
-- existing table/policies in place without touching existing rows.

create extension if not exists pgcrypto;

create table if not exists public.student_registrations (
  id uuid primary key default gen_random_uuid(),

  role text not null default 'student' check (role in ('student', 'personnel')),

  firstname text not null check (length(trim(firstname)) > 0),
  lastname text not null check (length(trim(lastname)) > 0),
  -- The same number already printed as a barcode on the person's physical
  -- school ID, typed in at registration rather than generated later - so
  -- scanning that card at the kiosk lines up with what they registered here.
  barcode text not null check (length(trim(barcode)) > 0),
  email text not null check (email = lower(email) and email like '%@smcbi.edu.ph'),
  password_hash text not null,

  birthday date not null check (birthday < current_date),
  gender text not null check (gender in ('male', 'female')),

  department text not null check (
    department in ('COLLEGE', 'BED', 'COLLEGE INSTRUCTOR', 'BED INSTRUCTOR', 'NTP')
  ),
  program text check (program in ('BSIT', 'BSED', 'BEED', 'BSHM', 'BSBA')),
  year_level text check (year_level in ('1st Year', '2nd Year', '3rd Year', '4th Year')),
  grade_level text check (
    grade_level in ('Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12')
  ),
  strand text check (strand in ('ABM', 'HUMSS', 'STEM')),

  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'imported')),

  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null,
  imported_at timestamptz,

  -- A student's department must be a student department, and a personnel
  -- department must belong to a personnel account. Otherwise "COLLEGE
  -- INSTRUCTOR" registered as role=student (or vice versa) would file the
  -- person in the wrong bucket in every admin report afterwards.
  constraint role_matches_department check (
    (role = 'student' and department in ('COLLEGE', 'BED'))
    or (role = 'personnel' and department in ('COLLEGE INSTRUCTOR', 'BED INSTRUCTOR', 'NTP'))
  ),

  -- Keep academic fields internally consistent with the selected department.
  -- Personnel accounts carry no program/year/grade/strand at all.
  constraint academic_fields_match_department check (
    (
      department = 'COLLEGE'
      and program is not null
      and year_level is not null
      and grade_level is null
      and strand is null
    )
    or (
      department = 'BED'
      and program is null
      and year_level is null
      and grade_level is not null
      and (
        (grade_level in ('Grade 11', 'Grade 12') and strand is not null)
        or (grade_level in ('Grade 7', 'Grade 8', 'Grade 9', 'Grade 10') and strand is null)
      )
    )
    or (
      department in ('COLLEGE INSTRUCTOR', 'BED INSTRUCTOR', 'NTP')
      and program is null
      and year_level is null
      and grade_level is null
      and strand is null
    )
  )
);

-- Case-insensitive uniqueness on email (defense in depth alongside the
-- lower(email) check constraint above).
create unique index if not exists student_registrations_email_key
  on public.student_registrations (lower(email));

create unique index if not exists student_registrations_barcode_key
  on public.student_registrations (barcode);

create index if not exists student_registrations_status_idx
  on public.student_registrations (status);

create index if not exists student_registrations_department_idx
  on public.student_registrations (department);

-- Admin accounts --------------------------------------------------------
-- Membership table for who is allowed into /admin. There is no self-service
-- sign-up: a row here is added from the SQL editor (service-role access)
-- after creating the matching user under Authentication -> Users. This is
-- deliberate - the admin surface should never grow itself.

create table if not exists public.admin_users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

drop policy if exists "A user can check their own admin status" on public.admin_users;

create policy "A user can check their own admin status"
  on public.admin_users
  for select
  to authenticated
  using (id = auth.uid());

-- security definer so RLS policies elsewhere can call this without granting
-- broad SELECT on admin_users itself.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Row Level Security -----------------------------------------------------
-- Public (anon/authenticated, unauthenticated visitor): may only INSERT a
-- new pending registration. Admins (authenticated + present in
-- admin_users): may SELECT, UPDATE, and DELETE any registration.

alter table public.student_registrations enable row level security;

drop policy if exists "Public can submit a pending student registration" on public.student_registrations;

create policy "Public can submit a pending student registration"
  on public.student_registrations
  for insert
  to anon, authenticated
  with check (
    status = 'pending'
    and role in ('student', 'personnel')
    and reviewed_at is null
    and imported_at is null
  );

drop policy if exists "Admins can view all registrations" on public.student_registrations;

create policy "Admins can view all registrations"
  on public.student_registrations
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can update registrations" on public.student_registrations;

create policy "Admins can update registrations"
  on public.student_registrations
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete registrations" on public.student_registrations;

create policy "Admins can delete registrations"
  on public.student_registrations
  for delete
  to authenticated
  using (public.is_admin());

-- Duplicate-email check ----------------------------------------------------
-- Lets the frontend check whether an email is already registered without
-- granting any SELECT access to the table itself.

create or replace function public.check_email_exists(p_email text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.student_registrations
    where lower(email) = lower(p_email)
  );
$$;

revoke all on function public.check_email_exists(text) from public;
grant execute on function public.check_email_exists(text) to anon, authenticated;

-- Duplicate-barcode (School ID) check ---------------------------------------

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

-- Dashboard stats -----------------------------------------------------------
-- Aggregated counts as a single RPC, so the dashboard doesn't need to pull
-- every row into the browser just to count them. Admin-only, same gate as
-- the table itself.

create or replace function public.registration_stats()
returns table (
  total bigint,
  student_count bigint,
  personnel_count bigint,
  college_count bigint,
  bed_count bigint,
  staff_count bigint,
  pending_count bigint,
  approved_count bigint,
  rejected_count bigint,
  imported_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    count(*) as total,
    count(*) filter (where role = 'student') as student_count,
    count(*) filter (where role = 'personnel') as personnel_count,
    count(*) filter (where department = 'COLLEGE') as college_count,
    count(*) filter (where department = 'BED') as bed_count,
    count(*) filter (where department in ('COLLEGE INSTRUCTOR', 'BED INSTRUCTOR', 'NTP')) as staff_count,
    count(*) filter (where status = 'pending') as pending_count,
    count(*) filter (where status = 'approved') as approved_count,
    count(*) filter (where status = 'rejected') as rejected_count,
    count(*) filter (where status = 'imported') as imported_count
  from public.student_registrations
  where public.is_admin();
$$;

revoke all on function public.registration_stats() from public;
grant execute on function public.registration_stats() to authenticated;

-- One call for every breakdown the dashboard's distribution charts need
-- (program, department, year level, grade level, strand, gender), instead
-- of a separate round trip - or a full table scan in the browser - per chart.
create or replace function public.registration_distribution()
returns table (dimension text, value text, count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select 'program', program, count(*) from public.student_registrations
    where public.is_admin() and program is not null group by program
  union all
  select 'department', department, count(*) from public.student_registrations
    where public.is_admin() group by department
  union all
  select 'year_level', year_level, count(*) from public.student_registrations
    where public.is_admin() and year_level is not null group by year_level
  union all
  select 'grade_level', grade_level, count(*) from public.student_registrations
    where public.is_admin() and grade_level is not null group by grade_level
  union all
  select 'strand', strand, count(*) from public.student_registrations
    where public.is_admin() and strand is not null group by strand
  union all
  select 'gender', gender, count(*) from public.student_registrations
    where public.is_admin() group by gender
  union all
  select 'grade_strand', grade_level || ' - ' || strand, count(*) from public.student_registrations
    where public.is_admin() and grade_level is not null and strand is not null
    group by grade_level, strand;
$$;

revoke all on function public.registration_distribution() from public;
grant execute on function public.registration_distribution() to authenticated;
