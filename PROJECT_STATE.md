# MOSCATELLI ATLAS — Project State

## Current patch
Patch 16 — **Final frontend handoff complete.** Authentication was implemented as the final feature patch.

## Current architecture
Static-hosting-compatible semantic HTML, modular CSS, vanilla JavaScript ES modules, hash routing and structured demonstration JSON. Search, Library, Playbooks, Academia, Updates and personal preview state are functional. The PWA shell is conservative. Supabase/MainHub/Slack/Gmail data integrations remain inactive and credential-free.

Authentication now consists of a visible threshold (`auth-gate.js`), a Supabase-compatible adapter (`auth-adapter.js`) and an inert provider bootstrap (`auth-provider.js`). The archive uses explicit demo mode for inspection and does not claim production security.

## Completed patches
1. Architecture, design tokens and project skeleton.
2. Application shell, hash router and separate Browse navigation.
3. Minimal Home search interaction.
4. Content model, taxonomy and Library browsing.
5. Article reader, governance metadata and reading progress.
6. Local full-text Search with synonym expansion, ranked results and command search.
7. Scenario-based Playbooks.
8. Academia learning paths, course/module/lesson readers, local progress and acknowledgements.
9. Updates, bookmarks, reading history and continue-reading state.
10. Advanced motion, View Transitions enhancement and continuity patterns.
11. Responsive, browser-zoom, accessibility and scaling hardening.
12. PWA shell, safe service-worker update flow and conservative offline resilience.
13. Integration contracts and inactive provider adapters.
14. Full frontend QA, content-density refinement and visual polish.
15. Final pre-authentication hardening and architecture/security audit.
16. Authentication threshold, explicit demo isolation, Supabase-ready auth adapter, sign-out/session architecture and final handoff.

## Active routes
`#/home`, `#/library`, `#/library/:category`, `#/article/:slug`, `#/search`, `#/playbooks`, `#/playbook/:slug`, `#/academia`, `#/academia/:path`, `#/updates`, `#/bookmarks`, `#/continue-reading`, `#/history`, `#/profile`.

## Working features
All planned frontend functionality is present in demo/preview form, including authentication threshold states, explicit demo entry, session-aware Profile and sign-out.

## Authentication state
- `authenticationEnabled: true`
- `demoMode: true` for this handoff archive
- Production provider: not connected
- Fake credential validation: none
- Demo session: `sessionStorage`, explicitly marked preview-only
- Future provider bootstrap: `assets/js/auth-provider.js`
- Future auth contract: `assets/js/auth-adapter.js`

## Known production limitations
See `docs/KNOWN_ISSUES.md`. Most importantly, production Supabase/RLS and private-content migration are still required before public deployment.

## Testing status
Patch 16 completed syntax, JSON/content/reference integrity, credential-pattern, auth-adapter mock, standalone Chromium auth/route/sign-out/mobile/reduced-motion and overflow checks. Direct local/file browser navigation is blocked by the execution environment, so modular source and service-worker registration could not be browser-tested through a real local URL here. See `QA.md`.

## Next developer task
Production integration and deployment only: connect Supabase Auth + RLS/content/search, disable demo mode, connect approved MainHub/Slack/Gmail boundaries, run independent security QA and physical-device/browser QA, then deploy.
