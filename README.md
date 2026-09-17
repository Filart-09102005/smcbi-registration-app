# SMCBI Student Pre-Registration Portal

A standalone, mobile-first web app that lets SMCBI students register their
information online before it is reviewed and bulk-imported into the existing
SMCBI Health Kiosk system. This project is independent of the Health Kiosk
codebase — nothing here modifies it.

**Stack:** React + Vite + Tailwind CSS (v3) + Supabase, deployed on Vercel.

## How registration data is prepared for the Kiosk

- Every submission is stored in a `student_registrations` table in Supabase
  with `status = 'pending'`.
- Passwords are **never stored in plain text**. The password is hashed in the
  browser with `bcryptjs` (10 rounds — the same default cost most PHP/Laravel
  stacks use) before it is sent to Supabase, so only `password_hash` is
  persisted. Plain-text passwords never leave the student's device.
- Duplicate school emails are rejected both proactively (a live availability
  check while typing) and authoritatively (a unique index in Postgres), so a
  race between two tabs can't create two rows for the same email.
- The public anon key can only **insert** a new `pending` row. There is no
  read, update, or delete access for anonymous/authenticated requests — see
  [supabase/schema.sql](supabase/schema.sql). Admin review/import tooling
  should be built separately using the Supabase **service-role** key from a
  trusted server environment, never from this frontend.

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

This creates:

- The `student_registrations` table with column checks that keep academic
  fields consistent with the selected department (e.g. a `BED` row can't also
  have a `program`, and only Grade 11/12 rows may have a `strand`).
- A case-insensitive unique index on `email`.
- Row Level Security policies that allow only `INSERT` of a `pending` row
  from the public anon key (no read/update/delete).
- A `check_email_exists(p_email)` function the frontend calls (via RPC) to
  show "this email is already registered" before submission, without ever
  granting the frontend read access to the table itself.

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

1. Push this project to its own Git repository.
2. In Vercel, **Add New Project** and import that repository.
3. Framework preset: **Vite**. Build command `npm run build`, output
   directory `dist` (Vercel detects these automatically).
4. Under **Environment Variables**, add `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` with the same values as your local `.env`.
5. Deploy. The portal is a static SPA, so no server runtime is required.

Because routing is client-side (`react-router-dom`), Vercel's default SPA
fallback for Vite projects handles deep links like `/register` correctly with
no extra configuration.

## Project structure

```
src/
  components/
    layout/PortalShell.jsx      shared header/footer shell
    steps/                      one component per wizard step
    ui/                         Button, TextField, OptionCards, PasswordField, ...
    ProgressSteps.jsx           1–5 progress indicator
  lib/
    academicOptions.js          department/program/grade/strand option lists
    password.js                 password rules + strength scoring
    validation.js                per-step validation + email/birthday rules
    registrations.js            Supabase submit + duplicate-check calls
    supabaseClient.js           Supabase client (reads Vite env vars)
  pages/
    WelcomePage.jsx
    RegisterPage.jsx            wizard state machine (steps 1–5)
    SuccessPage.jsx
supabase/
  schema.sql                    table, constraints, RLS, RPC function
```

## Registration flow

Welcome → Role & Department → Academic Information (dynamic by
department/grade) → Personal Information → Account Information → Review →
Submit → Confirmation.

- **College**: Program/Course + Year Level.
- **BED**: Grade Level, and Strand only appears for Grade 11–12; changing
  back to Grade 7–10 clears the strand automatically. Switching between
  College and BED clears the other department's fields.

## What's intentionally out of scope (next phase)

This deliverable is the registration portal only. Building the admin review
dashboard and the bulk import/sync into the Health Kiosk's MySQL `users`
table is a separate follow-up effort, and the Health Kiosk project itself has
not been modified.
