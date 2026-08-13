# MOSCATELLI ATLAS — PATCHLOG

## 0.1.0 — Patch 01: Architecture & Design Foundation

### Objective
Create the maintainable static-project skeleton and establish Atlas's visual, responsive, motion and accessibility foundations without implementing later product features prematurely.

### Changed / created files
- `index.html`
- `manifest.webmanifest`
- `README.md`
- `ROADMAP.md`
- `PROJECT_STATE.md`
- `PATCHLOG.md`
- `QA.md`
- `manifest.webmanifest`
- `sw.js`
- `assets/css/tokens.css`
- `assets/css/reset.css`
- `assets/css/base.css`
- `assets/css/layout.css`
- `assets/css/components.css`
- `assets/css/pages.css`
- `assets/css/motion.css`
- `assets/css/responsive.css`
- `assets/css/accessibility.css`
- `assets/js/config.js`
- `assets/js/app.js`
- `assets/js/router.js`
- `assets/js/store.js`
- `assets/js/content-service.js`
- `assets/js/search.js`
- `assets/js/motion.js`
- `assets/js/bookmarks.js`
- `assets/js/reading-progress.js`
- `assets/js/auth-adapter.js`
- `assets/js/integration-adapter.js`
- `assets/js/utils.js`
- `content/index.json`
- `docs/DESIGN_SYSTEM.md`
- `docs/CONTENT_MODEL.md`
- `docs/INTEGRATION_CONTRACT.md`
- `docs/ACCESSIBILITY.md`
- `docs/FINAL_HANDOFF.md`

### Validation performed
Recorded in `QA.md` with explicit evidence and limitations.

### Known remaining limitations
All product behaviour beyond the foundation is intentionally deferred to later focused patches.

### Next patch
Patch 02 — Application Shell, Hash Router & Navigation.

## 0.2.0 — Patch 02: Application Shell, Router & Navigation

### Objective
Turn the foundation into a functioning Atlas application shell while adopting the revised minimal Home direction: a light, modern search-led landing page and a separate Browse menu for manual research.

### Changed files
- `index.html`
- `manifest.webmanifest`
- `README.md`
- `ROADMAP.md`
- `PROJECT_STATE.md`
- `PATCHLOG.md`
- `QA.md`
- `assets/css/tokens.css`
- `assets/css/reset.css`
- `assets/css/base.css`
- `assets/css/layout.css`
- `assets/css/components.css`
- `assets/css/pages.css`
- `assets/css/motion.css`
- `assets/css/responsive.css`
- `assets/css/accessibility.css`
- `assets/js/config.js`
- `assets/js/app.js`
- `assets/js/router.js`
- `docs/DESIGN_SYSTEM.md`
- `docs/ACCESSIBILITY.md`
- `docs/FINAL_HANDOFF.md`

### Added / completed behaviour
- Hash route resolution and default Home route.
- Modern minimal Home shell.
- Separate Browse modal menu.
- All initial Library categories represented in manual-research navigation.
- Route placeholders for not-yet-built sections rather than dead controls.
- Search query routing to `#/search?q=...`.
- Empty-query validation and focus return.
- Modal focus containment/restoration.
- Active navigation state.

### Validation performed
Recorded in `QA.md` with explicit environment, evidence and limitations.

### Known remaining limitations
Feature content remains intentionally deferred. The Search route receives queries but does not yet return indexed results. Library categories route correctly but are not populated until Patch 04.

### Next patch
Patch 03 — Minimal Home Experience Refinement.


## 0.3.0 — Patch 03: Minimal Home Search Experience

### Objective
Make the Home search feel like a finished interaction without compromising the approved question-plus-search minimalism.

### Changed files
- `index.html`
- `README.md`
- `ROADMAP.md`
- `PROJECT_STATE.md`
- `PATCHLOG.md`
- `QA.md`
- `assets/css/components.css`
- `assets/css/motion.css`
- `assets/css/responsive.css`
- `assets/css/accessibility.css`
- `assets/js/app.js`
- `assets/js/config.js`
- `assets/js/store.js`
- `docs/DESIGN_SYSTEM.md`
- `docs/ACCESSIBILITY.md`

### Added / completed behaviour
- Progressive search suggestion panel, invisible at rest.
- Search query starters based on demonstration content from the Atlas brief.
- Recent-query continuity in explicitly namespaced demo local storage.
- Combobox/listbox keyboard interaction.
- `/` shortcut for Home search focus.
- Query filtering and direct query execution from suggestions.
- No fabricated result cards or indexed-content claims.

### Known remaining limitations
The Search route still only receives queries; actual indexing/ranking/results arrive in Patch 06. Library content begins next.

### Next patch
Patch 04 — Content Model, Taxonomy & Library Browsing.

## 0.4.0 — Patch 04: Content Model, Taxonomy & Library Browsing

### Objective
Replace Library placeholders with a maintainable local content model and a refined manual-research experience while preserving the approved minimal Home.

### Changed files
- `index.html`
- `README.md`
- `ROADMAP.md`
- `PROJECT_STATE.md`
- `PATCHLOG.md`
- `QA.md`
- `assets/css/pages.css`
- `assets/css/responsive.css`
- `assets/css/accessibility.css`
- `assets/js/app.js`
- `assets/js/config.js`
- `assets/js/content-service.js`
- `content/index.json`
- `content/articles/*.json` — 12 demonstration article documents
- `docs/CONTENT_MODEL.md`

### Added / completed behaviour
- Eight-subject Library taxonomy from the project brief.
- Twelve realistic, explicitly marked demonstration references.
- Governance, audience, permission and review metadata in the local schema.
- Static JSON content-service adapter with future-source separation.
- Functional all-Library and category Library routes.
- Responsive subject-strip navigation.
- Functional current-view filtering with Escape-to-clear.
- Category topic context and visible reference counts.
- Real article metadata deep links without prematurely implementing the article reader.
- Finance permission-readiness represented in the model without pretending frontend hiding is security.

### Validation performed
Recorded in `QA.md` with explicit evidence and limitations.

### Known remaining limitations
Article bodies are structured but intentionally not rendered until Patch 05. Global indexed Search remains Patch 06. Real permissions remain dependent on future authenticated Supabase/RLS integration.

### Next patch
Patch 05 — Article Reader, Governance Metadata & Reading Progress.

## 0.5.0 — Patch 05: Article Reader, Governance Metadata & Reading Progress

### Objective
Turn the structured article documents introduced in Patch 04 into a polished, readable and fully navigable long-form experience without adding dashboard clutter to Home or prematurely implementing later personal/search features.

### Changed files
- `index.html`
- `README.md`
- `ROADMAP.md`
- `PROJECT_STATE.md`
- `PATCHLOG.md`
- `QA.md`
- `assets/css/pages.css`
- `assets/css/responsive.css`
- `assets/css/accessibility.css`
- `assets/js/app.js`
- `assets/js/config.js`
- `assets/js/content-service.js`
- `assets/js/reading-progress.js`
- `content/index.json`
- All twelve JSON documents under `content/articles/`
- `docs/CONTENT_MODEL.md`

### Added / completed behaviour
- Full article-body rendering at `#/article/:slug`.
- Desktop sticky table of contents and mobile collapsible contents.
- Active-section table-of-contents state using `IntersectionObserver` where available.
- Semantic rendering of paragraphs, lists, checklists, procedures, callouts and quotes.
- Related-reference navigation.
- Full governance record presentation.
- Subtle visual and accessible reading-progress indicator.
- Namespaced local demo reading-progress persistence.
- Expanded realistic demonstration article content across the full current sample set.

### Validation performed
Recorded in `QA.md` with explicit environment, evidence and limitations.

### Known remaining limitations
Global ranked search, bookmarks, continue reading/history, feedback controls, authenticated progress and database-backed permissions remain deliberately deferred to their focused patches.

### Next patch
Patch 06 — Search Engine, Search Results, Synonyms & Highlighting.

## 0.6.0 — Patch 06: Search Engine, Search Results, Synonyms & Highlighting

### Objective
Replace the Search placeholder with a fast local full-text retrieval layer and a polished command-style search experience without adding permanent clutter to the approved minimal Home page.

### Changed files
- `index.html`
- `README.md`
- `ROADMAP.md`
- `PROJECT_STATE.md`
- `PATCHLOG.md`
- `QA.md`
- `assets/css/components.css`
- `assets/css/pages.css`
- `assets/css/motion.css`
- `assets/css/responsive.css`
- `assets/css/accessibility.css`
- `assets/js/app.js`
- `assets/js/config.js`
- `assets/js/search.js`
- `content/index.json`
- `docs/CONTENT_MODEL.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/ACCESSIBILITY.md`

### Added / completed behaviour
- Generated local index spanning article metadata and structured article body text.
- Weighted relevance ranking with stronger title/keyword/topic matches than body-only matches.
- Initial synonym vocabulary from the Atlas brief.
- Contextual search excerpts and highlighted matched terms.
- Full `#/search?q=...` route with subject filtering and no-result state.
- Keyboard result traversal from the search input.
- Command-style native `<dialog>` Search opened from Browse or `/` on non-search pages.
- Live top-result preview inside the command Search.
- Search adapter boundary designed to be replaced by Supabase full-text search later.
- Explicit permission-filter hook without pretending the unauthenticated static preview provides security.

### Validation performed
Recorded in `QA.md` with viewport, ranking, keyboard, overlay, regression and reduced-motion evidence.

### Known remaining limitations
The current local index contains article content only because Playbooks, Academia and Updates are not yet implemented. Authenticated role-aware filtering and database-level search permissions remain future Supabase/RLS work. Broad browser, screen-reader and physical-device testing remains pending.

### Next patch
Patch 07 — Playbooks and scenario-oriented reading experience.


## 0.7.0 — Patch 07: Playbooks & Scenario-Oriented Reading

### Objective
Introduce a distinct Playbooks experience for recurring operational situations and connect those playbooks to the existing local Search adapter.

### Changed files
- `index.html` (no structural change required; existing Playbooks navigation now resolves to implemented routes)
- `README.md`
- `ROADMAP.md`
- `PROJECT_STATE.md`
- `PATCHLOG.md`
- `QA.md`
- `assets/css/pages.css`
- `assets/css/responsive.css`
- `assets/css/accessibility.css`
- `assets/css/motion.css`
- `assets/js/app.js`
- `assets/js/config.js`
- `assets/js/content-service.js`
- `assets/js/search.js`
- `content/index.json`
- Nine JSON documents under `content/playbooks/`
- `docs/CONTENT_MODEL.md`
- `docs/DESIGN_SYSTEM.md`

### Added / completed behaviour
- Functional `#/playbooks` route with in-view situation filtering.
- Functional `#/playbook/:slug` deep links.
- Scenario, immediate action, who-to-inform, what-to-record, escalation, resource, related-procedure and governance structures.
- Nine realistic demonstration playbooks spanning suppliers, product/quality, operations, finance, people, systems and brand.
- Search index now spans both article and playbook content with type-correct deep links.
- Playbook deep routes preserve Playbooks navigation state.
- Responsive/mobile and forced-colour patterns added for the new experience.

### Known remaining limitations
Playbook templates are demonstration structures rather than editable production templates. MainHub record creation, authenticated ownership/permissions and external escalation actions remain inactive pending integration/authentication patches.

### Next patch
Patch 08 — Academia, learning paths, lessons and composed progress states.


## Patch 08 — Academia

### Objective
Create the structured learning area without gamification and connect lesson content to Atlas Search.

### Changed files
- `index.html`
- `assets/css/pages.css`
- `assets/css/responsive.css`
- `assets/js/app.js`
- `assets/js/config.js`
- `assets/js/content-service.js`
- `assets/js/search.js`
- `content/index.json`
- `content/academia/index.json`
- `content/academia/course-*.json`
- `content/academia/lesson-*.json`
- `PROJECT_STATE.md`
- `PATCHLOG.md`
- `QA.md`
- `ROADMAP.md`
- `docs/CONTENT_MODEL.md`

### Added
- Four demonstration learning paths.
- Module and lesson navigation.
- Required/optional learning state.
- Local development-preview completion and acknowledgement state.
- Course progress calculated from required lessons.
- Academia lessons in the local Search index.

### Validation
See `QA.md`.

### Remaining limitations
No authenticated progress sync, production curriculum, role assignment or certificates.

### Next patch
Patch 09 — Updates, bookmarks, reading history and continue reading.


## Patch 09 — Updates, bookmarks, reading history and continue reading
**Objective:** Introduce governed change communication and private local reading continuity without adding Home-page clutter.

### Changed files
- `index.html`
- `assets/css/pages.css`
- `assets/css/responsive.css`
- `assets/js/app.js`
- `assets/js/router.js`
- `assets/js/content-service.js`
- `assets/js/search.js`
- `assets/js/reading-progress.js`
- `assets/js/bookmarks.js`
- `assets/js/history.js` (new)
- `content/index.json`
- `content/updates/index.json` (new)
- `PROJECT_STATE.md`
- `PATCHLOG.md`
- `QA.md`
- `README.md`
- `ROADMAP.md`

### Validation performed
- JavaScript syntax checks for modular source and standalone build.
- Chromium route, interaction and persistence tests for Updates, acknowledgement, bookmarks, history and continue reading.
- Search verification for update content.
- Representative responsive and horizontal-overflow checks.

### Known remaining limitations
Personal state is local demonstration state only; Playbooks do not expose a completion model for Continue Reading; authentication/permissions remain deferred.

### Next patch
Patch 10 — Advanced motion and route-transition refinement.


## Patch 10 — Advanced motion and route-transition refinement
**Objective:** Introduce a documented, progressive-enhancement motion layer that makes navigation and state changes feel contemporary without compromising the restrained Atlas reading experience.

### Changed files
- `index.html`
- `assets/css/tokens.css`
- `assets/css/components.css`
- `assets/css/pages.css`
- `assets/css/motion.css`
- `assets/css/accessibility.css`
- `assets/js/app.js`
- `assets/js/config.js`
- `assets/js/motion.js`
- `PROJECT_STATE.md`
- `PATCHLOG.md`
- `QA.md`
- `README.md`
- `ROADMAP.md`
- `docs/DESIGN_SYSTEM.md`

### Added / changed behaviour
- Same-document View Transitions where supported, with graceful fallback.
- Shared title continuity from Library/Search/Playbook/personal result rows into destination pages.
- IntersectionObserver-based restrained list/section reveals.
- Animated Browse and command-search dismissal rather than abrupt disappearance.
- Transform-driven article and course progress indicators.
- Micro-motion feedback for bookmarks, acknowledgements and lesson completion.
- Removed hover animations that changed padding/layout geometry.
- Preserved the previous route until local content resolves to avoid loading flashes.
- Comprehensive `prefers-reduced-motion` behaviour.

### Validation
See `QA.md`.

### Remaining limitations
Cross-browser motion tuning and high zoom/text scaling are intentionally deferred to Patch 11.

### Next patch
Patch 11 — Responsive, zoom, accessibility and scaling hardening.


## Patch 11 — Responsive, browser-zoom, accessibility and scaling hardening

### Objective
Harden the established Atlas interface against narrow viewports, high browser zoom, text scaling, safe-area insets and keyboard/accessibility edge cases without changing its visual direction or adding new product scope.

### Changed files
- `index.html`
- `assets/css/tokens.css`
- `assets/css/reset.css`
- `assets/css/base.css`
- `assets/css/components.css`
- `assets/css/pages.css`
- `assets/css/responsive.css`
- `assets/css/accessibility.css`
- `assets/js/app.js`
- `docs/ACCESSIBILITY.md`
- `PROJECT_STATE.md`
- `PATCHLOG.md`
- `QA.md`
- `ROADMAP.md`

### Implementation
- Removed the document-level 320px minimum width so high-zoom and embedded/narrow contexts can genuinely reflow.
- Added safe-area-aware gutters and dialog padding.
- Hardened overflow handling for long titles, labels and translated-length text.
- Normalised key controls to an approximately 44px minimum touch target.
- Added relative-width collapse rules to protect text-only scaling as well as browser zoom.
- Added an extreme narrow state below 340px without making it the primary mobile design.
- Replaced whole-route live-region announcements with a concise dedicated route status and exposed route rendering through `aria-busy`.
- Added explicit Tab/Shift+Tab boundary trapping to both native modal dialogs as a cross-engine reinforcement of modal focus containment.
- Extended forced-colour support and added a print-safe long-form fallback.
- Corrected stale `--font-sans` references in Patch 09 controls to the canonical `--atlas-sans` token.

### Validation performed
See `QA.md` for the recorded viewport, zoom-equivalent, text-scale, focus, target-size, route and reduced-motion checks.

### Known remaining limitations
Physical assistive-technology testing and non-Chromium engine inspection remain deferred to the full QA/refinement patch.

### Next patch
Patch 12 — PWA shell, service worker and conservative offline resilience.

## Patch 12 — PWA shell, service worker and conservative offline resilience

### Objective
Prepare Atlas for installable PWA use and resilient shell loading without persisting private/internal knowledge on-device by default.

### Changed files
- `index.html`
- `manifest.webmanifest`
- `sw.js`
- `offline.html` (new)
- `assets/js/app.js`
- `assets/js/config.js`
- `assets/js/pwa.js` (new)
- `assets/css/components.css`
- `assets/icons/atlas-temp-192.png` (new temporary technical asset)
- `assets/icons/atlas-temp-512.png` (new temporary technical asset)
- `assets/icons/atlas-temp-maskable-512.png` (new temporary technical asset)
- `docs/PWA.md` (new)
- `README.md`
- `PROJECT_STATE.md`
- `PATCHLOG.md`
- `QA.md`
- `ROADMAP.md`
- `docs/FINAL_HANDOFF.md`

### Implementation
- Upgraded the manifest to `display: standalone` with relative scope/start URL and complete install icons.
- Added a versioned service worker for application-shell assets only.
- Explicitly excluded `content/`, future API/auth endpoints and Supabase-style REST/Storage/Functions paths from Cache Storage.
- Added safe old-cache removal and explicit update activation through `SKIP_WAITING`.
- Added a discreet connectivity/update status component that remains hidden during normal operation.
- Added a dedicated offline fallback and more precise offline content-unavailable messaging.
- Documented installability, caching boundaries and future production review requirements.

### Validation performed
See `QA.md` for executed tests and evidence.

### Known remaining limitations
- No physical mobile installation testing.
- No private-content offline mode by design.
- Standalone `file://` preview cannot exercise service-worker registration.

### Next patch
Patch 13 — Integration contracts and inactive Supabase/MainHub/Slack/Gmail adapters.

## Patch 13 — Integration contracts and inactive provider adapters

### Objective
Define maintainable, production-shaped boundaries for future Supabase, MainHub, Slack and Gmail integration without connecting any production service or implementing authentication early.

### Changed files
- `index.html`
- `assets/js/config.js`
- `assets/js/integration-adapter.js`
- `assets/js/integrations/errors.js` (new)
- `assets/js/integrations/supabase.js` (new)
- `assets/js/integrations/mainhub.js` (new)
- `assets/js/integrations/slack.js` (new)
- `assets/js/integrations/gmail.js` (new)
- `sw.js`
- `docs/INTEGRATION_CONTRACT.md`
- `docs/CONTENT_MODEL.md`
- `docs/PWA.md`
- `docs/FINAL_HANDOFF.md`
- `README.md`
- `PROJECT_STATE.md`
- `PATCHLOG.md`
- `QA.md`
- `ROADMAP.md`

### Implementation
- Replaced the original one-line integration placeholder with a central inactive registry.
- Added provider-specific adapter contracts with stable future operation names.
- Added typed disabled/not-implemented integration errors.
- Kept authentication completely separate and deferred.
- Documented entities, identifiers, RLS expectations, read/write boundaries, method signatures, safe errors, loading behaviour, offline behaviour and provider-specific security boundaries.
- Bumped the PWA shell version and included the new public adapter modules as shell assets.

### Validation performed
See `QA.md` for executed tests and evidence.

### Known remaining limitations
- Provider methods intentionally do not perform live work.
- Production schema/RLS/OAuth/Slack/MainHub configuration is not created here.
- Integration runtime cannot be end-to-end tested until services are connected.

### Next patch
Patch 14 — Full frontend QA and visual refinement.

## Patch 14 — Full frontend QA, content-density refinement and visual polish

### Objective
Audit and refine the mature frontend without expanding scope: improve reading density, mobile Search clarity, active navigation, interaction stability and consistency while preserving the minimal Home and all existing functionality.

### Changed files
- `index.html`
- `assets/js/config.js`
- `assets/js/app.js`
- `assets/css/base.css`
- `assets/css/components.css`
- `assets/css/pages.css`
- `assets/css/responsive.css`
- `assets/css/accessibility.css`
- `sw.js`
- `docs/PWA.md`
- `README.md`
- `PROJECT_STATE.md`
- `PATCHLOG.md`
- `QA.md`
- `ROADMAP.md`

### Implementation
- Normalised the smallest metadata labels to a more legible floor.
- Reduced mobile Search duplication by hiding the generic summary when a more relevant indexed excerpt exists.
- Removed the remaining padding-changing hover patterns from Library/related-reading/Academia interactions.
- Added a quiet non-colour-only current-route marker to Browse navigation.
- Relaxed article body line-height and refined focused Update treatment.
- Added stable scrollbar allocation to reduce width shift on pages that begin scrolling.
- Preserved Home exactly as the established minimal search-led composition.

### Validation performed
See `QA.md` for executed static, routing, responsive, keyboard and visual checks.

### Known remaining limitations
- Physical Safari/Firefox/iOS/Android testing is not available here.
- Production integration and authentication are intentionally inactive.
- Browser-level service-worker registration remains environment-limited.

### Next patch
Patch 15 — Final pre-authentication hardening and complete project-state/security audit.


---

## Patch 15 — Final pre-authentication hardening and project audit

### Objective
Complete the final non-authentication hardening pass so Patch 16 can focus exclusively on the authentication threshold and final handoff.

### Changed files
- `index.html`
- `assets/js/config.js`
- `assets/js/app.js`
- `assets/js/router.js`
- `assets/js/content-service.js`
- `sw.js`
- `README.md`
- `PROJECT_STATE.md`
- `ROADMAP.md`
- `QA.md`
- `docs/PWA.md`
- `docs/PRE_AUTH_AUDIT.md` (new)
- `docs/FINAL_HANDOFF.md`

### Changes
- Fixed the skip-navigation/hash-router collision by focusing the main landmark without mutating the route fragment.
- Hardened encoded route-segment parsing so malformed URI encoding degrades to the not-found route rather than throwing.
- Added `cache: "no-store"` to modular internal JSON reads.
- Extended the service-worker private/sensitive network-only branch to bypass the browser HTTP cache as well as Cache Storage.
- Added a same-origin referrer policy to the modular shell.
- Added a comprehensive pre-authentication architecture/security audit.
- Expanded the final-handoff document into a usable pre-authentication continuation record.
- Bumped preview/shell version to 0.15.0.

### Validation
See `QA.md` and `docs/PRE_AUTH_AUDIT.md`.

### Known remaining limitations
- Authentication is intentionally not implemented.
- Production RLS/integrations are inactive.
- Browser-level service-worker registration and physical-device/browser matrix remain environment-limited.
- Production hosting headers remain a deployment concern.

### Next patch
Patch 16 — authentication threshold last, explicit demo-mode isolation, final security/accessibility regression and completed handoff/archive.

## Patch 16 — Authentication threshold and final frontend handoff

### Objective
Implement authentication as the final frontend feature, keep development preview access impossible to confuse with production security, prepare the Supabase Auth boundary, and complete the handoff archive.

### Changed files
- `index.html`
- `assets/css/auth.css` (new)
- `assets/js/config.js`
- `assets/js/app.js`
- `assets/js/auth-adapter.js`
- `assets/js/auth-gate.js` (new)
- `assets/js/auth-provider.js` (new)
- `sw.js`
- `manifest.webmanifest`
- `README.md`
- `PROJECT_STATE.md`
- `ROADMAP.md`
- `PATCHLOG.md`
- `QA.md`
- `docs/AUTHENTICATION.md` (new)
- `docs/INTEGRATION_CHECKLIST.md` (new)
- `docs/DEPLOYMENT_CHECKLIST.md` (new)
- `docs/KNOWN_ISSUES.md` (new)
- `docs/FILE_MANIFEST.md` (new)
- `docs/FINAL_HANDOFF.md`

### Implementation
- Added a full-screen, bright authentication threshold while preserving the established light Atlas visual language.
- Added Email + Password, Email OTP and Password Reset interface states with correct autocomplete attributes.
- Added loading, error and success states and reduced-motion behaviour.
- Added explicit **Development preview** entry that uses an isolated `sessionStorage` demo session and performs no credential validation.
- Replaced the authentication placeholder with a Supabase-compatible adapter contract and a separate inert provider bootstrap boundary.
- Delayed Router/Search/PWA startup until access is established.
- Added session-aware Profile information and functional sign-out from Profile and Browse.
- Bumped shell/version metadata to final frontend handoff v1.0.
- Completed integration, deployment, authentication and known-issues documentation.

### Validation performed
See `QA.md` for final evidence.

### Known remaining limitations
Production Supabase/RLS, private-content migration, production security headers, live integrations and physical multi-browser/device QA remain deployment/integration work rather than frontend patch work.

### Next step
No additional frontend patch is planned. Proceed to production integration/security review/deployment only after the documented gates are satisfied.
