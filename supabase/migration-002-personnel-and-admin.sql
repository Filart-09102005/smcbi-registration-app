-- Migration 002: personnel role support + admin dashboard foundation
--
-- Run this in the Supabase SQL editor against a project that already ran
-- schema.sql and has live registration rows. It only widens constraints and
-- adds new tables/policies/functions - it does not touch existing rows, and
-- is safe to re-run.
--
-- If you are setting up a brand new project instead, just run schema.sql
-- (already updated to include everything below) and skip this file.

-- 1. Widen the role/department check constraints ---------------------------
-- Drops whatever Postgres auto-named the original single-column checks on
-- `role` and `department`, so this doesn't depend on guessing that name.
do $$
declare
  c record;
begin
  for c in
    select distinct con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_attribute att on att.attrelid = rel.oid and att.attnum = any(con.conkey)
    where rel.relname = 'student_registrations'
      and con.contype = 'c'
      and att.attname in ('role', 'department')
  loop
    execute format('alter table public.student_registrations drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.student_registrations
  add constraint student_registrations_role_check check (role in ('student', 'personnel'));

alter table public.student_registrations
  add constraint student_registrations_department_check check (
    department in ('COLLEGE', 'BED', 'COLLEGE INSTRUCTOR', 'BED INSTRUCTOR', 'NTP')
  );

alter table public.student_registrations
  drop constraint if exists role_matches_department;

alter table public.student_registrations
  add constraint role_matches_department check (
    (role = 'student' and department in ('COLLEGE', 'BED'))
    or (role = 'personnel' and department in ('COLLEGE INSTRUCTOR', 'BED INSTRUCTOR', 'NTP'))
  );

alter table public.student_registrations
  drop constraint if exists academic_fields_match_department;

alter table public.student_registrations
  add constraint academic_fields_match_department check (
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
  );

create index if not exists student_registrations_department_idx
  on public.student_registrations (department);

alter table public.student_registrations
  add column if not exists reviewed_by uuid references auth.users (id) on delete set null;

-- 2. Admin accounts ----------------------------------------------------------
-- No self-service sign-up: a row here is added manually from the SQL editor
-- (see the bottom of this file) after creating the matching user under
-- Authentication -> Users. The admin surface should never grow itself.

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

-- 3. Widen the public insert policy to allow personnel ----------------------
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

-- 4. Admin read/update access -------------------------------------------------
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

-- 5. Dashboard stats RPC -------------------------------------------------------
-- One round trip for every summary count, instead of pulling every row into
-- the browser just to count them.
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

-- 7. Distribution breakdowns RPC ----------------------------------------------
-- One call for every breakdown the dashboard's distribution charts need
-- (program, department, year level, grade level, strand, gender).
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

-- ============================================================================
-- After running everything above, create your admin login:
--
-- 1. Supabase Dashboard -> Authentication -> Users -> Add user
--    - Enter the admin's email and a password
--    - Check "Auto Confirm User"
--
-- 2. Back in the SQL editor, run (with that same email):
--
--      insert into public.admin_users (id, email)
--      select id, email from auth.users where email = 'admin@example.com';
--
-- That account can now sign in at /admin/login.
-- ============================================================================
