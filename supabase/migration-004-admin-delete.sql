-- Migration 004: admin delete access
--
-- The original design deliberately left DELETE ungranted - a rejected
-- registration was meant to be kept, not destroyed, so the record of the
-- decision survives. The admin dashboard now exposes a real Delete action
-- per row, so this grants the matching RLS policy. Without it, the button
-- exists in the UI but every delete is silently rejected by the database.
--
-- Safe to re-run.

drop policy if exists "Admins can delete registrations" on public.student_registrations;

create policy "Admins can delete registrations"
  on public.student_registrations
  for delete
  to authenticated
  using (public.is_admin());
