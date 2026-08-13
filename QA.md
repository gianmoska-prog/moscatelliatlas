# MOSCATELLI ATLAS — QA

## Patch 10

| Test | Environment | Result | Evidence | Known limitation |
|---|---|---|---|---|
| Route navigation regression | Chromium standalone | Pass | Home, Library, Search, Playbooks, Playbook reader, Academia, course, Updates, Bookmarks, Continue Reading and History routes exercised without page errors | Full content matrix is reserved for final QA |
| View Transitions capability | Chromium standalone | Pass | `document.startViewTransition` available and invoked during route navigation | Other engines deferred to Patch 11 |
| Shared title continuity | Controlled Chromium transition harness | Pass | Library result source mapped to destination `h1` as `atlas-shared-title`; transition flags and inline name cleaned after completion | Visual interpolation is browser-engine-specific |
| CSS fallback route motion | Chromium standalone | Pass | Route entry marker remains available independently of View Transitions | Timing is intentionally subtle |
| Reduced motion | Chromium `prefers-reduced-motion: reduce` emulation | Pass | View Transition orchestration count remained 0; article content opacity remained 1 | OS/device-level test not available |
| Scroll-entry reveals | Chromium standalone | Pass | Initial Library references receive reveal classes and become visible; 900ms safety fallback prevents stranded hidden content | IntersectionObserver rendering differs slightly by engine |
| Browse overlay dismissal | Chromium standalone | Pass | `data-closing` state holds dialog open during 170–180ms exit, then closes and restores focus to Browse | Route-link navigation closes immediately by design |
| Search overlay dismissal | Chromium standalone | Pass | Explicit close uses animated exit; navigation closes immediately to avoid focus stealing | — |
| Reading progress | Chromium standalone, long article | Pass | `aria-valuenow` updates and bar uses `--article-progress-ratio` / transform rather than animated width | Scroll position in headless Chromium is not identical to a physical browser |
| State micro-motion | Chromium standalone | Pass | Bookmark toggle state changed correctly with WAAPI pulse enhancement | Visual pulse is intentionally bypassed under reduced motion |
| Responsive overflow | 320×568, 390×844, 768×1024, 1440×900, 1920×1080 | Pass | No horizontal overflow on tested Home/Library/Search/Playbooks/Academia views | Browser zoom hardening is Patch 11 |
| JavaScript syntax | Node `--check` | Pass | `app.js`, `motion.js` and router parse successfully | Runtime QA uses standalone build |
| JSON validity | Python JSON parser | Pass | All content JSON files parse successfully | Schema validation remains a later QA task |

### Visual inspection
- 390×844 Home inspected: minimal search-led composition preserved.
- 1440×900 Library inspected: existing hierarchy and warm-light visual direction preserved.
- Motion changes do not add permanent interface furniture to Home.

Authentication and production permissions remain intentionally out of scope until the final implementation patch.

## Patch 11

| Test | Environment | Result | Evidence | Known limitation |
|---|---|---|---|---|
| Full target viewport matrix | Chromium standalone: 320×568, 360×800, 390×844, 412×915, 768×1024, 1024×768, 1280×800, 1440×900, 1920×1080, 2560×1440 | Pass | Representative Home, Library, article, Playbooks and Academia routes reported `scrollWidth === clientWidth` | Browser-engine differences remain for final QA |
| Zoom-equivalent reflow | Chromium standalone using effective CSS layout viewports for 75%, 100%, 125%, 150% and 200% zoom from a 1440×900 baseline | Pass | Home, long article and Updates had no horizontal overflow at 1920×1200, 1440×900, 1152×720, 960×600 and 720×450 | Headless Chromium does not expose browser-chrome zoom; this tests the resulting layout widths rather than UI zoom itself |
| Sub-320 reflow | Chromium standalone, 280×600 | Pass | Home and full-width Browse dialog remained within a 280px document width | 280px is a resilience case, not a primary design target |
| 200% text-size simulation | Chromium standalone, root font size doubled at 1440×900 | Pass | Home, Library, article, Playbook, Academia lesson and Updates showed no horizontal overflow | CSS root scaling approximates text-only scaling; physical OS/browser text settings remain untested |
| Touch target baseline | Chromium standalone, 390×844 Updates | Pass | All visible main-area buttons/selects measured at least 44px high; minimum observed 44px | Inline editorial text links are not treated as button-sized targets |
| Mobile input stability | Chromium standalone, 390×844 Home | Pass | Home search computed at 16px, avoiding automatic focus zoom on common mobile browsers | iOS Safari physical keyboard/autofill still requires device testing |
| Skip navigation | Fresh Chromium standalone document, 390×844 | Pass | First Tab focused the skip link; focused link rendered within viewport at y=12px | Screen-reader announcement not physically tested |
| Browse focus containment | Chromium standalone | Pass | Repeated Tab traversal remained inside open Browse dialog; Escape/close restored focus to Browse | Native dialog behavior is reinforced with explicit boundary trapping |
| Command Search focus containment | Chromium standalone | Pass | Search input receives opening focus; repeated Tab traversal remained inside; close restored focus to Browse | Physical Safari dialog behavior remains untested |
| Route announcements | Chromium standalone | Pass | Dedicated `role=status` announces concise titles (for example `Library`); `#app` no longer has `aria-live` | VoiceOver/NVDA announcement phrasing requires physical AT testing |
| Route busy state | Chromium standalone | Pass | `aria-busy` is set while route work resolves and removed after commit; no stale busy state observed across active routes | Very slow network behavior deferred to integration/offline testing |
| Heading hierarchy smoke | 14 active representative routes | Pass | Exactly one `main h1` observed on every tested route | Full document-outline judgement remains part of final QA |
| Reduced motion | Chromium `prefers-reduced-motion: reduce` | Pass | Routes remained visible and overflow-free with no page errors | Physical OS animation settings not tested |
| Forced colours | Chromium `forced-colors: active` | Pass | Updates route remained usable and overflow-free with no page errors | Windows High Contrast + Firefox/Edge physical validation remains later |
| Control accessible names | Chromium standalone | Pass | No unnamed persistent/Home buttons detected; Home search has a programmatic label | Full accessibility-tree audit remains final QA |
| Token contrast calculation | WCAG relative-luminance calculation against `#F7F5F0` canvas | Pass | Ink 15.66:1; ink-soft 9.72:1; muted 5.04:1; bronze 5.28:1; warning 4.92:1 | Semi-transparent component combinations require final visual spot checks |
| JavaScript syntax | Node `--check`, all `assets/js/*.js` | Pass | All modules parse successfully | Modular runtime is validated through standalone because localhost navigation is restricted in this environment |
| JSON validity | Python JSON parser, `content/**/*.json` | Pass | All development content parses successfully | Formal schema validation remains a later QA task |
| Runtime errors | Chromium standalone | Pass | No `pageerror` events across route, viewport, zoom-equivalent, reduced-motion or forced-colour tests | Console warnings from deliberately unavailable production integrations are outside current scope |

### Visual inspection
- 390×844 Home: minimal search-led composition remains intact and uncluttered.
- 320×568 Browse: primary navigation remains comfortably readable; lower manual-research sections remain reachable through the panel's own scrolling region.
- 720×450 zoom-equivalent Home: headline and search remain coherent without clipping.
- 1440×900 long article: reading column, contents rail, demonstration notice, procedures, related references and governance remain correctly composed after reveal completion.

### Recorded limitation
Browser-chrome zoom itself cannot be manipulated reliably in this headless Chromium environment. Patch 11 therefore validates the CSS layout viewport sizes produced by 75–200% zoom and separately validates 200% text scaling. Physical Safari/Firefox/assistive-technology testing remains explicitly deferred rather than claimed.

## Patch 12 — PWA and offline resilience

| Test | Environment | Result | Evidence | Known limitation |
|---|---|---|---|---|
| Manifest parse / install fields | Static inspection | PASS | JSON parses; standalone display, relative start URL/scope, 192/512/maskable icons present | Browser install UI not exercised |
| Service-worker syntax | Node syntax check | PASS | `sw.js` parses without syntax errors | Does not replace runtime registration test |
| Service-worker registration | Chromium local-HTTP attempt | BLOCKED | Chromium returned `ERR_BLOCKED_BY_ADMINISTRATOR` for localhost navigation in this environment | Must be exercised in a normal browser/server environment before production |
| Shell precache policy | Node VM service-worker harness | PASS | 30 shell resources captured by mocked `cache.addAll`; every listed local file exists | Mock validates code path rather than browser Cache Storage implementation |
| Private content excluded from cache | Node VM service-worker harness | PASS | `/content/index.json` took the network-only branch; no cache write occurred | Production API paths require integration-stage verification |
| Offline navigation fallback | Node VM service-worker harness | PASS | Simulated network failure returned the precached `index.html` response | Browser service-worker runtime remains blocked locally |
| Old-cache cleanup | Node VM service-worker harness | PASS | Prior `atlas-shell-v0.11.0-static` removed while unrelated cache remained | Browser Cache Storage runtime remains blocked locally |
| Update activation message | Node VM service-worker harness | PASS | `SKIP_WAITING` message invoked `self.skipWaiting()` | Full update lifecycle requires browser runtime |
| Standalone responsive regression | Chromium `page.set_content` | PASS | 320×568, 390×844, 768×1024, 1440×900, 1920×1080 and 2560×1440 all reported no horizontal overflow or page/console errors | Does not exercise service-worker registration |
| Offline status component | Chromium `page.set_content`, 320×568 | PASS | Synthetic offline event exposed the status message without horizontal overflow | Connectivity event only; not a network-stack test |

### Patch 12 visual inspection
- 390×844 Home: existing minimal search-led composition preserved; PWA status remains absent during normal operation.
- 1440×900 Home: no permanent PWA furniture was added; normal-state composition remains unchanged.

### Recorded environment limitation
Chromium navigation to both `http://127.0.0.1`/`localhost` and `file://` is blocked by the execution environment with `ERR_BLOCKED_BY_ADMINISTRATOR`. For that reason, Patch 12 does **not** claim browser-level service-worker registration or installability testing. The standalone UI was rendered through Chromium `page.set_content`, while service-worker cache/fetch/update behaviour was validated with an isolated Node VM harness.

## Patch 13 — Integration contracts and inactive adapters

| Test | Environment | Result | Evidence | Known limitation |
|---|---|---|---|---|
| JavaScript syntax | Node `--check`, all `assets/js/**/*.js` | PASS | Every application and integration module parsed successfully | Does not exercise a provider SDK |
| Adapter registry shape | Node 22 ES-module harness | PASS | Registry exposed Supabase, MainHub, Slack and Gmail; every descriptor reported `enabled: false` and `implemented: false` | Providers remain intentionally inactive |
| Disabled adapter behaviour | Node 22 ES-module harness | PASS | Representative method on each provider rejected with `ATLAS_INTEGRATION_DISABLED`; unknown registry names throw `TypeError` | Live provider errors cannot be tested yet |
| Credential-pattern scan | Static repository scan | PASS | No OpenAI-style key, Slack token, JWT-shaped credential or AWS access-key pattern matched project files | Pattern scan supplements, not replaces, security review |
| Service-worker shell references | Static file-existence validation | PASS | `atlas-shell-v0.13.0` contains 35 shell entries; all referenced local files exist, including five new integration modules | Browser SW registration remains environment-limited |
| Content JSON validity | Python JSON parser | PASS | All 42 JSON content/config documents parsed successfully | Formal schema validation remains final QA work |
| Standalone UI regression | Chromium `page.set_content`, 390×844 and 1440×900 | PASS | Home retained `What are you looking for?`; no horizontal overflow/page errors; Browse opened/closed; `supplier` search routed correctly and returned results | Integration patch intentionally introduces no visible provider UI |

### Patch 13 visual inspection
- 390×844 search-results regression inspected: layout remains readable and stable after the architecture-only patch.
- 1440×900 search-results regression inspected: existing light/minimal visual hierarchy remains unchanged.
- No new integration controls are displayed because no provider is live; this is intentional rather than an unfinished UI state.

## Patch 14 — Full frontend QA and visual refinement

| Test | Environment | Result | Evidence | Known limitation |
|---|---|---|---|---|
| JavaScript syntax | Node `--check`, all `assets/js/**/*.js` | PASS | 19 JavaScript modules parsed successfully | Does not substitute for browser runtime |
| JSON validity | Python JSON parser, all content JSON | PASS | All 42 JSON documents parsed successfully | Formal external JSON Schema is not yet introduced |
| Route/content linkage | Python static audit | PASS | 41 indexed items checked; no missing article, playbook or lesson documents; course lesson references resolved | Dynamic future Supabase records are outside this preview |
| Layout-shifting hover audit | Static CSS scan + targeted source cleanup | PASS | No remaining hover/focus rule changes padding or margin | Browser paint/compositor differences remain engine-specific |
| Representative route regression | Chromium standalone | PASS | Home, Library, Search, article, Playbooks, Playbook reader, Academia, lesson, Updates, Bookmarks, Continue Reading and History exercised at mobile/desktop; no page errors | `page.set_content` does not exercise service-worker registration |
| Responsive matrix | Chromium standalone | PASS | High-value routes tested at 320×568, 390×844, 768×1024, 1440×900, 1920×1080 and 2560×1440 with zero horizontal overflow | Physical devices remain untested |
| Browse/Search keyboard regression | Chromium standalone | PASS | Browse opened/closed, focus restored, `/` opened command Search from Library, Search input received focus, Library was correctly marked current | Screen-reader/device combinations remain untested |
| Reduced motion | Chromium `reduced_motion=reduce` emulation | PASS | Menu transition collapsed to 0.01ms-equivalent and Browse remained fully operable | OS-level physical testing remains outstanding |

### Patch 14 additional evidence
- 200%-layout-equivalent regression at 720×450: Home, Library, Search, article and Updates produced no horizontal overflow.
- 200% root-text simulation at 1440×900: the same routes produced no horizontal overflow or page errors.
- Mobile Search with a distinct body match now renders a single relevant excerpt instead of duplicating summary + excerpt; metadata floor measured 12px and excerpt 14.56px at 390×844.
- Visual inspection completed on 390×844 Home and Search, 1440×900 Library, and a scrolled 1440×900 long-form article reader.
- Full-page screenshots can capture unrevealed below-fold items before the 900ms motion fallback fires; this is a capture-timing artefact. Scrolled/settled views confirmed content reveals correctly, and content remains visible when reduced motion or IntersectionObserver absence disables enhancement.


---

## Patch 15 — pre-authentication hardening audit

| Test | Environment | Result | Evidence | Known limitation |
|---|---|---|---|---|
| JavaScript syntax | Node.js `--check` across `assets/js/**/*.js` plus `sw.js` | Pass | 19 application JS files plus service worker parsed without syntax errors. | Syntax validation is not runtime integration testing. |
| JSON / manifest parse | Python JSON parser | Pass | 43 JSON/manifest documents parsed successfully. | Schema semantics are checked separately below. |
| Content/reference integrity | Python static audit | Pass | 8 categories, 41 indexed items (12 articles, 9 Playbooks, 14 Academia lessons, 6 Updates), 4 courses and 6 update documents cross-resolve. Article related links, Playbook procedures, course lessons and Update targets all resolve. | Demonstration content quality/approval is not being asserted. |
| Service-worker shell manifest | Python static audit | Pass | All 34 declared shell asset paths resolve to project files. | Browser service-worker registration remains blocked by environment navigation policy. |
| Credential-like runtime scan | Recursive source scan | Pass | No service-role key/token/private-key patterns found in runtime assets/content. | Pattern scanning is not a substitute for independent security review. |
| Runtime external dependency scan | Recursive HTML/JS/CSS/manifest scan | Pass | No runtime `http://` or `https://` dependency detected. | Future production integrations will intentionally introduce configured endpoints. |
| Unsafe URL / inline-event scan | Recursive source scan | Pass | No `javascript:` URL or inline HTML event-handler attribute detected. | Programmatic event handlers remain expected. |
| Router normal paths | Node ESM route harness | Pass | Home, article, Library category and Search hashes resolve to expected route names. | Does not simulate browser History API timing. |
| Malformed route encoding | Node ESM + Chromium standalone harness | Pass | `#/article/%E0%A4%A` and `#/playbook/%ZZ` degrade to `not-found`; Chromium renders the existing not-found experience without a page error. | None identified in tested cases. |
| Skip navigation vs hash router | Chromium standalone harness, 1440×900 | Pass | Activating Skip to content keeps `location.hash` at `#/home` and moves focus to `#main-content`. | Browser harness uses injected standalone HTML because direct file/localhost navigation is blocked by the environment. |
| Home/Browse/Search regression | Chromium standalone harness | Pass | 320×568, 390×844, 768×1024, 1440×900, 1920×1080 and 2560×1440 all rendered Home, opened/closed Browse, submitted Search and showed no page/console errors. | Harness uses `page.set_content()` rather than HTTP navigation. |
| Horizontal overflow regression | Same Chromium viewport matrix | Pass | `scrollWidth <= clientWidth + 1` on Home and Search at every tested size. | Other deep routes inherit Patch 14 broad regression coverage and were not re-run exhaustively because Patch 15 did not alter their CSS/templates. |
| Reduced-motion smoke | Chromium, 390×844, `reduced_motion="reduce"` | Pass | Browse open/close completed without page errors. | Not a physical-device assistive-technology test. |
| Visual inspection | Chromium screenshots, 390×844 and 1440×900 after motion settled | Pass | Minimal search-led Home remains visually unchanged by hardening work; no skip-link or transition artifact remains after settle. | Screenshots are Chromium only. |
| Private content cache policy | Static code inspection | Pass | `content-service.js` requests internal JSON with `cache: "no-store"`; service worker sends `content/`, auth/API/Supabase sensitive paths network-only with `cache: "no-store"` and does not put them in Cache Storage. | Server response headers are still a production infrastructure requirement. |

### Patch 15 conclusion
No new blocking frontend issue was found after the hardening fixes above. The remaining implementation work is intentionally concentrated in Patch 16: authentication threshold, explicit demo-mode separation, final auth/security/accessibility regression, and complete handoff/archive.

---

## Patch 16 — final authentication and handoff QA

| Test | Environment | Result | Evidence | Known limitation |
|---|---|---|---|---|
| JavaScript syntax | Node.js `--check` | Pass | `auth-adapter.js`, `auth-gate.js`, `auth-provider.js`, `app.js`, integration registry/provider code and `sw.js` parse successfully. | Syntax checking is not a live provider test. |
| JSON/content integrity | Python static audit | Pass | 42 JSON documents parse; all 41 indexed knowledge items and content references resolve; service-worker shell paths resolve. | Demonstration content approval is not asserted. |
| Credential-pattern scan | Recursive source scan | Pass | No service-role/JWT/OpenAI/Slack/GitHub credential-like runtime token pattern found. | Pattern scanning is not an independent security review. |
| Auth adapter contract | Node ESM mock Supabase-compatible client | Pass | Session read, password sign-in, OTP request, reset request, auth-state listener/unsubscribe and sign-out all invoked through the adapter as expected. | Real Supabase network/session semantics remain untested until production client connection. |
| Initial auth threshold | Chromium standalone harness, 1440×900 | Pass | Page starts `data-auth-state="locked"`; auth gate visible; application surface `aria-hidden="true"` and inert. | Harness uses `page.set_content()` because direct local/file navigation is blocked by administrator policy. |
| Auth interface modes | Chromium standalone harness | Pass | Password → Email code → Password → Reset → Password views all switch correctly and remain focusable. | Real email delivery not connected by design. |
| Unconfigured provider behaviour | Chromium standalone harness | Pass | Submitting the ordinary sign-in form reports that the production provider is not connected; no fake credential success occurs. | Standalone preview intentionally has no provider. |
| Explicit demo entry | Chromium standalone harness | Pass | `Enter Atlas demo` transitions to `data-auth-state="authenticated"` and reveals the existing minimal Home. | Demo session is preview-only and not authorisation. |
| Session-aware Profile | Chromium standalone harness | Pass | Profile renders Development Preview session/name/email/role state and warning copy. | Production profile data awaits Supabase. |
| Sign-out | Chromium standalone harness | Pass | Profile sign-out clears the demo session, closes dialogs and returns to the locked threshold. Browse also exposes a Sign out control. | Multi-tab production session propagation remains a deployment test. |
| Mobile authentication layout | Chromium standalone harness, 390×844 | Pass | Gate is fully usable; email field computes to 16px; no horizontal overflow. | Physical mobile keyboard/autofill remains untested. |
| Auth desktop visual inspection | Chromium screenshot, 1440×900 | Pass | Bright restrained threshold visually matches Atlas; no dark/SaaS-heavy treatment introduced. | Chromium only. |
| Auth mobile visual inspection | Chromium screenshot, 390×844 | Pass | Panel remains readable and touch-oriented in portrait; demo state remains clearly identified. | Chromium emulation, not a physical device. |
| Reduced motion | Chromium `prefers-reduced-motion: reduce`, 768×1024 | Pass | Demo authentication entry completes immediately without relying on the success animation; no page error. | OS/assistive-technology hardware test unavailable. |
| Horizontal overflow | Chromium 1440×900 and 390×844 auth + authenticated Home | Pass | `scrollWidth <= clientWidth` in tested states. | Deep routes rely on Patch 14/15 matrix plus unchanged layouts. |
| Console/page errors | Chromium standalone final auth scenarios | Pass | No JavaScript page errors or console errors in desktop/mobile/reduced-motion scenarios. | Does not exercise real ES-module HTTP loading. |
| Modular browser loading | Chromium attempt with local-file base | Environment blocked | Browser reports local-resource loads blocked by administrator policy, matching the pre-existing environment limitation. | Modular source was syntax/static tested; use a normal HTTP server outside this restricted environment. |
| Service worker | Static/harness boundary checks | Pass within environment limits | Final shell cache includes new auth CSS/JS; sensitive/private request branch remains network-only/no-store. | Browser-level registration requires normal HTTPS/localhost navigation outside this environment. |

### Final QA conclusion
The planned **frontend** patch sequence is complete. No blocking defect was found in the tested final standalone authentication flow. Production readiness still depends on the documented Supabase/RLS/private-content migration, production hosting headers, independent security review and physical multi-browser/device testing.
