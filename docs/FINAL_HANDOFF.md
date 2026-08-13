# MOSCATELLI ATLAS — FINAL HANDOFF

Status: **Frontend implementation complete through Patch 16. Production integrations are intentionally not connected.**

## 1. What Atlas is
MOSCATELLI ATLAS is MOSCATELLI's private institutional knowledge, standards, education and situational-reference platform.

- **MainHub runs the company.**
- **Atlas explains the company.**

The frontend is designed as a bright, calm, modern internal archive/learning environment rather than a generic corporate wiki.

## 2. Architecture

- Semantic HTML5 shell.
- Modular CSS in `assets/css/`.
- Vanilla JavaScript ES modules in `assets/js/`.
- No mandatory build process.
- Hash routing for static hosting/GitHub Pages.
- Structured demonstration JSON in `content/`.
- Generated local Search implementation that is replaceable by a production permission-aware provider.
- Conservative PWA application-shell cache.
- Separate inactive provider adapters for Supabase data, MainHub, Slack and Gmail.
- Separate authentication threshold/adapter/provider-bootstrap architecture.

## 3. Routing
`assets/js/router.js` owns hash parsing and route matching.

Active routes:

- `#/home`
- `#/library`
- `#/library/:category`
- `#/article/:slug`
- `#/search`
- `#/playbooks`
- `#/playbook/:slug`
- `#/academia`
- `#/academia/:path`
- `#/updates`
- `#/bookmarks`
- `#/continue-reading`
- `#/history`
- `#/profile`

Malformed encoded route segments fail into the existing not-found route rather than throwing.

## 4. Content loading
`assets/js/content-service.js` is the preview content boundary.

- Modular builds fetch demonstration JSON with same-origin credentials and `cache: "no-store"`.
- The standalone preview embeds equivalent demonstration data directly for no-server inspection.
- Demonstration policy/operational/educational content is **not approved final MOSCATELLI policy**.

For production, private content must move behind RLS/permission-aware data access. Publicly readable static JSON is not an acceptable security model for private Atlas content.

## 5. Search
`assets/js/search.js` builds the local preview index across:

- Library references and full article text
- Playbooks
- Academia lessons
- Updates

It supports weighted fields, synonyms, highlighted matches, snippets and a permission-filter callback boundary.

**Production Search must be replaced by a permission-aware source.** Restricted titles, snippets, counts and body text must never be returned to unauthorised browsers.

## 6. Authentication
Authentication was implemented as the final frontend patch.

Files:

- `assets/js/auth-gate.js` — visible threshold, UI state, demo session, sign-out and session snapshot.
- `assets/js/auth-adapter.js` — Supabase-compatible auth contract without embedded SDK/credentials.
- `assets/js/auth-provider.js` — single inert production provider-bootstrap boundary.
- `assets/css/auth.css` — threshold/profile presentation.

Supported interface/adapter states:

- Email/password sign-in
- Email OTP/magic-link request
- Password reset request
- Session lookup
- Auth-state subscription boundary
- Loading/error/success states
- Sign-out
- Session-aware Profile
- Explicit development demo entry

### Demo mode
The delivered archive uses `demoMode: true` so it can be inspected without production credentials.

The threshold visibly states **Development preview** and exposes a separate **Enter Atlas demo** button. This creates only an isolated `sessionStorage` preview session and never validates submitted credentials.

To prepare production:

1. Implement `assets/js/auth-provider.js` with the approved MOSCATELLI Supabase browser client.
2. Call `configureAuthAdapter(client)`.
3. Set `demoMode: false`.
4. Keep `authenticationEnabled: true`.
5. Connect profile/role resolution.
6. Verify RLS before exposing private content.

See `AUTHENTICATION.md`.

## 7. Demo/local state
`assets/js/store.js` namespaces preview preferences/personal state under `moscatelli.atlas.demo.`.

This currently covers bookmarks, history, reading progress, learning progress and acknowledgements. It is preview state only.

The authentication demo session is deliberately separate and stored as:

`moscatelli.atlas.demo.auth-session.v1` in `sessionStorage`.

Production personal state must use authenticated/RLS-protected persistence if it needs cross-device continuity.

## 8. Playbooks
Playbooks use scenario-first operational structure:

1. Scenario
2. Immediate action
3. Who to inform
4. What to record
5. Escalation conditions
6. Templates/resources
7. Related procedures
8. Owner/version/review governance

The presentation intentionally avoids alarm-heavy visual treatment.

## 9. Academia
Academia supports:

- Courses
- Modules
- Lessons
- Required/optional reading
- Estimated time
- Completion state
- Acknowledgement state
- Progress

The experience is deliberately professional and non-gamified.

## 10. PWA / offline
The application is installable-ready and includes:

- `manifest.webmanifest`
- `sw.js`
- `offline.html`
- Versioned application-shell caching
- Safe worker update activation
- Offline shell/fallback behaviour

The service worker intentionally excludes internal knowledge and future authenticated/provider responses from Cache Storage. Sensitive/private same-origin paths use network-only requests with `cache: "no-store"`.

Temporary `atlas-temp-*` icons must be replaced before brand approval.

See `PWA.md`.

## 11. Future integrations
Read `INTEGRATION_CONTRACT.md` and `INTEGRATION_CHECKLIST.md`.

### Supabase
Prepared for:

- Authentication/profiles/roles
- Article permissions/content/versions
- Categories
- Playbooks
- Courses/lessons
- Progress/bookmarks/acknowledgements
- Search
- Updates
- Storage
- Audit records

All private data access must use database-level Row Level Security.

### MainHub
Prepared for return links and context links to products, suppliers, finance records and operational records.

### Slack
Prepared for important-update notifications, required reading, Search shortcut, article links and weekly knowledge digest. Secrets must remain server-side.

### Gmail
Prepared for communication-template/procedure references and tightly scoped future draft workflows. Mailbox contents must never be casually exposed to Atlas.

## 12. Accessibility and responsive state
Implemented/tested frontend provisions include:

- Semantic landmarks
- Heading hierarchy
- Hash-router-safe skip navigation
- Keyboard navigation
- Visible focus
- Native dialogs with focus containment/restoration
- Route announcements
- Accessible form labels
- Mobile-safe 16px authentication/search inputs
- Reduced-motion support
- Forced-colour support
- Safe-area support
- Long-title/translated-text wrapping
- Responsive article/mobile TOC treatment
- Broad 320px-to-ultrawide layout hardening
- 125–200%-equivalent zoom/reflow and 200% text-scaling tests in prior patches

## 13. Motion
`assets/js/motion.js` is the non-essential motion boundary.

It uses View Transitions, IntersectionObserver and Web Animations only as progressive enhancement. Routing/content/search/state do not depend on motion support. `prefers-reduced-motion` provides a complete non-animated path.

## 14. Security state
The archive contains:

- No production passwords.
- No Supabase service-role key.
- No Slack bot/signing secret.
- No Gmail OAuth secret.
- No GitHub/OpenAI token.
- No private production data.
- No live production URL/client configuration.

The final static scan found no credential-like runtime token pattern covered by the audit.

### Critical production rule
The authentication threshold is an interface/session boundary, **not a replacement for backend authorisation**. Private static files must not be publicly deployable merely because the UI is gated. Production content/Search/personal state must be protected by RLS/authorised services.

## 15. What remains mocked/inactive

- Production Supabase client/configuration
- Real users/profiles/roles
- Production content database
- Production permission-aware Search
- Authenticated bookmarks/progress/acknowledgements
- MainHub routes
- Slack server integration
- Gmail integration
- Final PWA brand icons
- Production domain/security headers
- Production telemetry/logging, if desired

## 16. What was visually tested
Final Patch 16 visual inspection/runtime checks used Chromium standalone harnesses for:

- Authentication desktop at 1440×900
- Authentication mobile at 390×844
- Minimal Home after demo authentication
- Alternate Email Code and Reset states
- Session-aware Profile
- Sign-out and relock
- Reduced-motion authentication entry
- Horizontal overflow on final auth/Home states

Earlier patches visually exercised Home, Library, Search, article readers, Playbooks, Academia and Updates across representative mobile/desktop sizes.

See `QA.md` for exact evidence.

## 17. What was not tested in this environment

- Real Supabase authentication/network sessions
- Real RLS
- Browser-level service-worker registration through a normal local/HTTPS URL
- Physical iPhone/iPad/Android devices
- Physical Safari/Firefox browser engines
- Password-manager/autofill on real browsers/devices
- Actual email OTP/reset delivery
- Screen-reader hardware/software combinations
- Production host security headers
- Live MainHub/Slack/Gmail integrations

Direct file/localhost browser navigation is blocked by administrator policy in this execution environment. The final standalone was tested through injected Chromium content; modular ES modules were syntax/static validated.

## 18. Integration checklist
Use `docs/INTEGRATION_CHECKLIST.md` before live service connection.

## 19. Deployment checklist
Use `docs/DEPLOYMENT_CHECKLIST.md`. Do not deploy private production content until every relevant authentication/RLS/security gate is complete.

## 20. Known issues
See `docs/KNOWN_ISSUES.md`.

## 21. Complete file manifest
See `docs/FILE_MANIFEST.md`, generated from the final Patch 16 project tree.

## 22. Recommended next developer sequence

1. Review this archive and `PRE_AUTH_AUDIT.md` / `QA.md`.
2. Connect the approved MOSCATELLI Supabase browser client in `auth-provider.js`.
3. Disable demo mode.
4. Implement/verify profiles and Row Level Security.
5. Move private content and Search behind RLS-aware access.
6. Replace demo local personal state where cross-device persistence is needed.
7. Connect MainHub/Slack/Gmail only through their documented boundaries.
8. Replace temporary PWA icons.
9. Configure production security/cache headers.
10. Run independent security, real browser/device and staging acceptance testing.
11. Deploy only after those gates pass.

This archive is intended to be understandable without relying on the original ChatGPT conversation.
