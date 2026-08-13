# MOSCATELLI ATLAS — PRE-AUTHENTICATION AUDIT

Status: **Historical Patch 15 audit. Patch 16 authentication has since been completed; retain this document as the pre-authentication baseline.**

This audit is the final static/frontend hardening checkpoint before Atlas gains an authentication threshold. It does not claim production security approval: Supabase schema, RLS, live sessions, provider integrations, production headers and physical-device/browser testing remain outside the current frontend-only environment.

## 1. Architecture verified

- Static, GitHub-Pages-compatible shell remains modular: semantic HTML, CSS, vanilla ES modules and hash routing.
- Home remains the minimal search-led experience.
- Library, articles, Search, Playbooks, Academia, Updates and personal demo-state routes remain separated by clear module/content boundaries.
- Supabase, MainHub, Slack and Gmail adapters remain present but disabled.
- Authentication remains isolated in `assets/js/auth-adapter.js`.
- No production SQL migration or live provider client was introduced.

## 2. Security findings resolved in Patch 15

### Skip-link/hash-router collision
Atlas uses the URL fragment for application routing. The conventional `href="#main-content"` skip link could therefore replace the active application route with a non-route fragment.

**Resolution:** the skip link now uses a dedicated click binding that prevents fragment mutation and focuses/scrolls the main landmark directly.

### Malformed route encoding
A deliberately malformed percent-encoded route segment could previously cause `decodeURIComponent()` to throw before a route could degrade to the not-found experience.

**Resolution:** route segment decoding now fails closed to the existing not-found route instead of throwing.

### Internal-content browser caching
Patch 12 prevented private/internal content from entering service-worker Cache Storage, but ordinary browser HTTP caching remained possible for static JSON requests.

**Resolution:** current internal JSON reads and the service worker's future private/sensitive network-only branch now explicitly use `cache: "no-store"`. Production HTTP response headers remain the authoritative control and must still be configured.

### Referrer minimisation
The modular application now declares a same-origin referrer policy. Atlas currently has no external runtime links, but this reduces accidental referrer disclosure if one is introduced before production infrastructure headers are available.

## 3. Static integrity checks

Patch 15 audit checks verify:

- all project JSON parses successfully;
- category, item ID and item slug uniqueness;
- every article, Playbook and Academia lesson metadata entry has a matching document;
- every course lesson reference resolves;
- article related references resolve;
- Playbook related procedures resolve;
- Update target references resolve;
- service-worker shell assets exist;
- JavaScript syntax parses;
- no `javascript:` URLs or inline HTML event-handler attributes are present;
- no production credential-like token patterns are present in the repository;
- runtime source contains no external `http://` or `https://` dependency;
- the standalone preview remains self-contained.

## 4. Intentional pre-production limitations

- Preview content is demonstration material rather than approved policy.
- Local bookmarks/history/progress/acknowledgements are demo-only local state.
- Search permissions are not production enforcement; RLS-aware search must replace the local index.
- There is no live authentication session yet.
- There is no live Supabase, MainHub, Slack or Gmail connection.
- Service-worker registration cannot be fully browser-tested in the present execution environment.
- Physical Safari, Firefox, iOS and Android testing remains outstanding.
- Production security headers (CSP, HSTS, `X-Content-Type-Options`, Permissions Policy and server `Cache-Control`) belong at the hosting layer and are not simulated by this static preview.
- Temporary Atlas PWA icons still require final brand assets.

## 5. Production security gates after authentication

1. Connect Supabase Auth using the final adapter boundary.
2. Design and test RLS for every private entity and Storage object.
3. Ensure unauthorised records never reach the browser, including Search titles/snippets.
4. Replace demo-local personal state with authenticated persistence.
5. Configure production HTTP security/cache headers.
6. Test logout/session expiry against every route, cached shell state and future local persistence.
7. Run role-matrix tests using separate real test accounts.
8. Run physical-device/browser QA.
9. Run an independent code/security review before public DNS points at Atlas.

## 6. Patch 16 entry condition

Patch 16 may now implement the authentication threshold without first repairing unrelated architecture. It must keep demo mode explicit and separable from the real adapter, must not add fake password validation, and must finish the complete handoff/archive.


## Post-audit note
Patch 16 completed the authentication threshold and preserved the security conditions above: explicit demo isolation, no fake password validation, no production credentials, and continued requirement for database-level RLS before public deployment.
