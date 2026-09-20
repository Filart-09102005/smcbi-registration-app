-- Migration 007: re-assert the public insert policy
--
-- Live submissions started failing with 42501 ("new row violates row-level
-- security policy") even though the payload satisfies the intended
-- with-check clause below. That specific error only comes from the policy
-- itself rejecting the row, not from a missing grant or a check constraint -
-- so the policy currently on the table must differ from this one. Re-running
-- this is safe regardless of what's currently there: it just drops and
-- recreates the same policy schema.sql already defines.

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

-- Sanity check: confirms RLS is enabled and lists every policy currently on
-- the table, so if a submission still fails after this, we can see exactly
-- what's live (e.g. a leftover RESTRICTIVE policy from earlier troubleshooting
-- that would silently AND against the permissive one above).
select relrowsecurity as rls_enabled, relforcerowsecurity as rls_forced
from pg_class
where oid = 'public.student_registrations'::regclass;

select policyname, cmd, permissive, roles, qual, with_check
from pg_policies
where tablename = 'student_registrations';
