-- SMCBI Student Pre-Registration Portal
-- Run this in the Supabase SQL editor (Project -> SQL Editor -> New query).

create extension if not exists pgcrypto;

create table if not exists public.student_registrations (
  id uuid primary key default gen_random_uuid(),

  role text not null default 'student' check (role = 'student'),

  firstname text not null check (length(trim(firstname)) > 0),
  lastname text not null check (length(trim(lastname)) > 0),
  email text not null check (email = lower(email) and email like '%@smcbi.edu.ph'),
  password_hash text not null,

  birthday date not null check (birthday < current_date),
  gender text not null check (gender in ('male', 'female')),

  department text not null check (department in ('COLLEGE', 'BED')),
  program text check (program in ('BSIT', 'BSED', 'BEED', 'BSHM', 'BSBA')),
  year_level text check (year_level in ('1st Year', '2nd Year', '3rd Year', '4th Year')),
  grade_level text check (
    grade_level in ('Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12')
  ),
  strand text check (strand in ('ABM', 'HUMSS', 'STEM')),

  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'imported')),

  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  imported_at timestamptz,

  -- Keep academic fields internally consistent with the selected department.
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
  )
);

-- Case-insensitive uniqueness on email (defense in depth alongside the
-- lower(email) check constraint above).
create unique index if not exists student_registrations_email_key
  on public.student_registrations (lower(email));

create index if not exists student_registrations_status_idx
  on public.student_registrations (status);

-- Row Level Security -----------------------------------------------------
-- The public anon key may only INSERT a new pending registration. There is
-- no SELECT/UPDATE/DELETE policy for anon/authenticated, so the frontend
-- cannot read back, list, or modify any registration (its own or anyone
-- else's). Admin review/import tooling should use the service-role key,
-- which bypasses RLS, from a trusted server environment only.

alter table public.student_registrations enable row level security;

drop policy if exists "Public can submit a pending student registration" on public.student_registrations;

create policy "Public can submit a pending student registration"
  on public.student_registrations
  for insert
  to anon, authenticated
  with check (
    status = 'pending'
    and role = 'student'
    and reviewed_at is null
    and imported_at is null
  );

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
