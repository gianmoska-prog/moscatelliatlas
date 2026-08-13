# MOSCATELLI Atlas — production integration handoff

## Implemented

- Supabase authentication with password, email OTP verification, session restore, password recovery and reliable sign-out.
- Profile identity and role presentation sourced from the RLS-protected `profiles` table, never user-editable auth metadata.
- RLS-protected Atlas categories, content, courses, bookmarks, progress, acknowledgements and Slack delivery records.
- Permission-aware PostgreSQL full-text search and 41 seeded demonstration knowledge records.
- JWT-protected `atlas-slack` Edge Function. Only active founders and partners may post important/required Atlas notices to the configured Slack updates route.
- Pinned Supabase browser client, lockfile, executable regression tests and project validation.
- Audit fixes for limited-result totals, eager document fetching, duplicated Academia index requests, rejected View Transitions and dismissible PWA updates.

## Deployment configuration still required

1. Production origin: `https://gianmoska-prog.github.io/moscatelliatlas/`.
2. Add that exact origin and recovery URL to Supabase Auth → URL Configuration.
3. `atlas-slack` falls back to this production origin; an `ATLAS_PUBLIC_URL` secret may override it later.
4. Keep the supplied demonstration corpus labelled as demonstration until MOSCATELLI editorial approval replaces it.
5. Run `npm ci && npm run check` before publishing.

The publishable Supabase key in `assets/js/config.js` is intentionally public and protected by RLS. Never add a service-role key or Slack credential to this repository.

## Shared MainHub digest security

`mainhub-slack` still accepts `email_digest` before its shared-secret check. This was not changed because the 10:00/22:00 caller is external and could not be inspected or updated from this task. Moving the secret check above `email_digest` without updating that caller would silently break the digest. The safe remediation is:

1. Update the external digest caller to send `x-mainhub-secret` from secret storage.
2. Confirm a test digest in `mainhub-testing`.
3. Move `email_digest` below the shared-secret validation.
4. Confirm both scheduled Rome-time deliveries.

The separate Atlas Slack function does not inherit this exception; it requires a valid user JWT and rechecks the caller's active founder/partner profile.
