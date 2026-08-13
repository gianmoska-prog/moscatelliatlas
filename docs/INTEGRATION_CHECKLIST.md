# MOSCATELLI ATLAS — Integration Checklist

## Supabase authentication
- [ ] Supply browser-safe Supabase project configuration through deployment configuration.
- [ ] Implement `assets/js/auth-provider.js` and call `configureAuthAdapter(client)`.
- [ ] Set `demoMode: false` in production.
- [ ] Verify password sign-in.
- [ ] Verify email OTP/magic-link flow.
- [ ] Verify password reset and redirect handling.
- [ ] Verify session refresh and expired-session behaviour.
- [ ] Verify sign-out from Browse and Profile.

## Supabase data / permissions
- [ ] Create/confirm profiles, roles, articles, versions, categories, Playbooks, courses, lessons, progress, bookmarks, acknowledgements, updates and audit entities.
- [ ] Implement Row Level Security for every private/restricted entity.
- [ ] Confirm Finance/sensitive records are denied at database level for unauthorised users.
- [ ] Replace local content reads with permission-aware data access.
- [ ] Replace local Search with permission-aware Supabase/PostgreSQL search.
- [ ] Verify restricted content never appears in result titles, snippets or counts.
- [ ] Replace demo local personal state with authenticated persistence where required.

## MainHub
- [ ] Define production/staging MainHub base URLs.
- [ ] Implement the MainHub adapter route mapping.
- [ ] Verify deep links from Atlas guidance into the correct live work record.
- [ ] Verify Return to MainHub.

## Slack
- [ ] Keep Slack bot/signing secrets server-side only.
- [ ] Implement update / required-reading notification service.
- [ ] Implement Search Atlas shortcut only through approved server boundaries.
- [ ] Verify links return to authenticated Atlas routes.

## Gmail
- [ ] Keep mailbox access server-side/connector-bound; do not expose mailbox contents in ordinary Atlas payloads.
- [ ] Implement only approved template/draft/reference operations.
- [ ] Verify permissions and audit behaviour.

## Final integration gate
- [ ] Independent security review.
- [ ] Permission/RLS tests using at least Founder, Operations/Marketing and least-privilege users.
- [ ] Production privacy/cache headers verified.
- [ ] Staging acceptance test completed before production switch-over.
