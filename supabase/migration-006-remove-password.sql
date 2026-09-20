-- Migration 006: remove password collection from pre-registration
--
-- This portal is a PRE-registration system, not the final account/login
-- system - the Health Kiosk creates the actual login account (and its
-- initial password) at bulk-import time, the same way it already does when
-- an admin manually adds a student/teacher there. Nothing here should ever
-- have held a password at all going forward.
--
-- Safe to re-run. Existing rows simply lose the password_hash column and
-- everything they already hold; nothing else about them changes.

alter table public.student_registrations
  drop column if exists password_hash;
