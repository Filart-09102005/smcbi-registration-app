# SMCBI Student Pre-Registration Portal

A standalone, mobile-first web app that lets SMCBI students register their
information online before it is reviewed and bulk-imported into the existing
SMCBI Health Kiosk system. This project is independent of the Health Kiosk
codebase — nothing here modifies it.

**Stack:** React + Vite + Tailwind CSS (v3) + Supabase, deployed on Vercel.

## How registration data is prepared for the Kiosk

- Every submission is stored in a `student_registrations` table in Supabase
  with `status = 'pending'`. This is a **pre-registration only** — there is no
  password field anywhere in this app. The Health Kiosk creates the actual
  login account (with its own generated password) once an admin imports the
  approved row; nothing here ever collects or stores a credential.
- Duplicate school emails and School IDs are rejected both proactively (a live
  availability check while typing) and authoritatively (unique indexes in
  Postgres), so a race between two tabs can't create two rows for the same
  person.
- The public anon key can only **insert** a new `pending` row for `role in
  ('student', 'personnel')` — see [supabase/schema.sql](supabase/schema.sql).
  Reading, updating, or deleting registrations requires an authenticated
  admin account (`is_admin()`, backed by the `admin_users` table); a per-IP
  rate limit trigger caps registration attempts at the database level.
- A built-in **admin dashboard** (`/admin`) shows registration distribution
  charts, and an **admin students page** (`/admin/students`) lets an admin
  search/filter/approve registrations and preview + download the approved
  set as Excel or PDF (columns match the Health Kiosk bulk-import format —
  see the header comment in
  [`src/lib/exportRegistrations.js`](src/lib/exportRegistrations.js)).
  Actually importing that file into the Kiosk's own `users` table is a
  separate, not-yet-built step on the Kiosk side.

## 1. Install dependencies

```bash
npm install
```

## 2. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project (free
   tier is fine).
2. Once it's provisioned, open **Project Settings → API**. You'll need:
   - **Project URL**
   - **anon public** key (never use the `service_role` key in this app)

## 3. Create the required table

1. In the Supabase dashboard, open **SQL Editor → New query**.
2. Paste the entire contents of [supabase/schema.sql](supabase/schema.sql)
   and run it.

This creates the complete, current schema for a **fresh** Supabase project in
one pass: the `student_registrations` table (with the column checks that keep
academic fields consistent with the selected role/department), the
`admin_users` table and `is_admin()` helper, RLS policies (public insert-only
of a `pending` row; admin-only read/update/delete), the duplicate-check RPC
functions, the `registration_stats`/`registration_distribution` functions the
admin dashboard charts read from, and the per-IP registration rate limiter.

If you already have an older copy of this database, don't re-run
`schema.sql` — apply `supabase/migration-00N-*.sql` in numeric order instead;
each one upgrades an existing database by the one thing its name describes and
is safe to re-run.

After running `schema.sql`, create at least one admin: add a user under
**Authentication → Users** in the Supabase dashboard, then insert a matching
row into `admin_users`:

```sql
insert into public.admin_users (id, email)
select id, email from auth.users where email = 'admin@example.com';
```

Only rows in `admin_users` can sign in to `/admin` — self-service sign-up is
disabled by RLS on that table.

## 4. Configure environment variables

Copy the example file:

```bash
cp .env.example .env
```

Then fill in your Supabase values in `.env`:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

`.env` is already git-ignored — never commit real keys, and never put a
`service_role` key in this file (it's a frontend app; anything here ships to
the browser).

## 5. Run locally

```bash
npm run dev
```

Open the printed local URL (typically `http://localhost:5173`). If the
environment variables above are missing, the app shows a clear configuration
notice instead of a broken form.

## 6. Deploying to Vercel

1. Push this project to its own Git repository (already done — see
   [github.com/Filart-09102005/smcbi-registration-app](https://github.com/Filart-09102005/smcbi-registration-app)).
2. In Vercel, **Add New Project** and import that repository.
3. Framework preset: **Vite**. Build command `npm run build`, output
   directory `dist` (Vercel detects these automatically — no need to set
   `buildCommand`/`outputDirectory` in `vercel.json`).
4. Under **Environment Variables**, add the two required variables below to
   the Production (and Preview, if you want preview deployments to work
   against the same Supabase project) environment.
5. Deploy.

### Required environment variables

| Variable | Where to find it | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API → Project URL | Public — safe in a browser bundle |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon` `public` key | Public — RLS is the actual boundary, not this key. **Never** set the `service_role` key here or anywhere in this frontend |

Vite only exposes env vars prefixed `VITE_` to the browser bundle, and only
these two exist anywhere in the codebase (verified by a full-project grep —
see `SECURITY-AUDIT.md`).

### What `vercel.json` already handles

- **SPA fallback** — every path rewrites to `/index.html` so deep links like
  `/register`, `/admin`, `/admin/students` work on a hard refresh or direct
  visit, since routing is client-side (`react-router-dom`).
- **Security headers** on every response: a `Content-Security-Policy`
  (`frame-src` allows `blob:` for the in-app PDF export preview, everything
  else is locked to `'self'`), `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`,
  and HSTS. Nothing further to configure in the Vercel dashboard for these.

### Production build sanity check

`npm run build` outputs a static `dist/` (no server runtime required). Before
trusting a deploy, it's worth serving `dist/` locally with the *exact* headers
from `vercel.json` at least once — the CSP is only enforced in that
production path, never by `vite dev`, so a header that's too strict (e.g. a
`frame-src` blocking the PDF preview's `blob:` iframe) won't show up until
then.

## Project structure

```
src/
  components/
    layout/PortalShell.jsx      shared header/footer shell
    steps/                      one component per registration wizard step
    ui/                         Button, TextField, OptionCards, ...
    ProgressSteps.jsx           1-4 progress indicator
    admin/                      admin-only UI: login guard, students table,
                                 registration detail/edit modals, Excel/PDF
                                 preview modals, LargeModal shell
    admin/charts/               DistributionChart (dashboard donut/split-bar/
                                 stat-tile charts)
  lib/
    academicOptions.js          role/department/program/grade/strand lists
    validation.js                per-step validation + email/birthday rules
    registrations.js            Supabase submit + duplicate-check calls
    adminApi.js                  admin CRUD/search/pagination queries
    adminStats.js                dashboard stats/distribution RPC calls
    exportRegistrations.js       Excel/PDF blob builders shared by the
                                 preview modals and the actual download
    supabaseClient.js           Supabase client (reads Vite env vars)
  pages/
    WelcomePage.jsx
    RegisterPage.jsx            wizard state machine (steps 1-4)
    SuccessPage.jsx
    admin/                      AdminLoginPage, AdminDashboardPage,
                                 AdminStudentsPage
supabase/
  schema.sql                    complete schema for a fresh project
  migration-00N-*.sql           incremental upgrades for an existing database
```

## Registration flow

Welcome → Role & Department → Academic Information (dynamic by
department/grade) → Personal Information → Review → Submit → Confirmation.

There is no password step — this is a pre-registration, not an account
signup. The Health Kiosk creates the login account when an approved row is
imported.

- **Student**: College (Program/Course + Year Level) or BED (Grade Level,
  Strand only for Grade 11-12).
- **Personnel**: College Instructor, BED Instructor, or NTP — no academic
  fields.

## Admin

`/admin/login` → `/admin` (dashboard: total + distribution charts by type,
department, program, year level, grade level, strand, gender) → `/admin/students`
(search/filter/paginate every registration, view/edit/delete, approve/reject,
and preview + download the current filtered set as Excel or PDF).

## What's intentionally out of scope (next phase)

This project stops at producing the Excel/PDF export — actually importing
that file into the Health Kiosk's own `users` table (replicating its
`firstname + "12345"` initial-password convention server-side) is a separate,
not-yet-built effort on the Kiosk side. The Health Kiosk project itself has
not been modified by anything in this repo.
