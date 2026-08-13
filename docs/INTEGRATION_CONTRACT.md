# MOSCATELLI ATLAS — INTEGRATION CONTRACT

Status: **Final frontend handoff — architecture contracts implemented; production connections inactive.**

This document defines the boundaries that Codex or another production developer should preserve when connecting Atlas to MOSCATELLI services. It is intentionally provider-aware but credential-free. Patch 13 performs no production writes, creates no SQL migration, connects no Slack/Gmail account and does not modify MainHub.

## 1. Non-negotiable security boundary

- **Database-level Row Level Security is mandatory** for Supabase-backed private data. Hiding a frontend route, card, search result or button is not authorisation.
- Never bundle Supabase service-role credentials, Slack bot tokens/signing secrets, Gmail OAuth client secrets, GitHub tokens, OpenAI keys or passwords in the static frontend.
- A Supabase publishable/anon key may eventually be used client-side only together with correctly tested RLS policies.
- Slack and Gmail provider secrets belong behind an authorised server-side boundary such as protected Supabase Edge Functions or an equivalent backend.
- Restricted Atlas content must be filtered before it reaches an unauthorised browser. This includes titles, summaries, search excerpts, Storage URLs and governance metadata when sensitive.
- Authentication is implemented separately in `assets/js/auth-adapter.js`, `auth-gate.js` and `auth-provider.js`; production provider configuration is still inactive in this archive.

## 2. Stable identifiers

Production entities should use immutable IDs internally and stable slugs for human-readable Atlas routes.

Expected identifiers:

| Entity | Primary identifier | Human route/reference |
|---|---|---|
| profile | UUID | email/display name are attributes, not identifiers |
| role | stable text key or UUID | role key |
| category | UUID or stable key | `category.slug` |
| article | UUID | `article.slug` |
| article version | UUID | version number/string |
| playbook | UUID | `playbook.slug` |
| course | UUID | `course.slug` |
| module | UUID | ordered inside course |
| lesson | UUID | `lesson.slug` |
| update | UUID | optional stable slug |
| bookmark | UUID/composite user+content key | content type + content ID |
| progress | UUID/composite user+content key | content type + content ID |
| acknowledgement | UUID/composite user+item key | item ID |
| stored asset | Storage path + record ID | signed/authorised URL only |
| audit record | UUID | append-only event reference |

Do not use mutable titles, email addresses or array positions as durable foreign keys.

## 3. Supabase data boundary

Frontend adapter: `assets/js/integrations/supabase.js`.
Authentication is deliberately excluded from this file.

### Required entities

Production schema planning should cover at least:

- `profiles`
- `roles` and profile-role assignment (or an equivalent role model)
- `categories`
- `articles`
- `article_versions`
- `playbooks`
- `courses`
- `modules`
- `lessons`
- `updates`
- `bookmarks`
- `reading_progress`
- `learning_progress`
- `acknowledgements`
- authorised Storage metadata
- audit records

The exact SQL design is intentionally deferred. **Do not derive a production migration solely from this preview content.**

### Expected read/write boundaries

Reads:
- profile and role needed for presentation;
- authorised categories/content/playbooks/courses/lessons/updates;
- authorised search results;
- the current user's bookmarks, progress and acknowledgements;
- authorised Storage objects via short-lived signed or policy-protected URLs.

Writes:
- the current user's bookmark/progress/acknowledgement state;
- tightly defined editorial/admin writes only for users with explicit roles;
- append-only audit events where required.

The normal reader must never receive broad edit rights merely because Atlas runs in a trusted-looking UI.

### Adapter method signatures

Patch 13 establishes these async method names. Production implementations may enrich returned records but should preserve the semantic purpose so page code does not need wholesale rewriting.

```js
getProfile({ userId })
listCategories({ audience, language })
listArticles({ category, status, cursor, limit })
getArticle({ slug, version })
listPlaybooks({ status, cursor, limit })
getPlaybook({ slug })
listCourses({ audience })
getCourse({ slug })
getLesson({ slug })
listUpdates({ status, since, cursor, limit })
search({ query, filters, cursor, limit })
listBookmarks({ userId, cursor, limit })
setBookmark({ userId, contentType, contentId, bookmarked })
getProgress({ userId, contentType, contentId })
saveProgress({ userId, contentType, contentId, progress })
acknowledge({ userId, itemType, itemId, version })
getAuthorisedAssetUrl({ path, expiresIn })
appendAuditEvent({ actorId, action, entityType, entityId, metadata })
```

The frontend must not accept a caller-supplied `userId` as proof of identity. Production implementations derive/validate identity from the authenticated session and RLS.

### Search permission expectation

The local preview can filter records only for demonstration. Production search must query a permission-aware source so restricted title/summary/body text is never returned to a user who cannot read the source item.

## 4. Authentication boundary

File: `assets/js/auth-adapter.js`.

Authentication is implemented separately so data-integration work does not accidentally absorb it. The frontend now supports the following contract/UI states:

- existing MOSCATELLI Supabase users/profiles;
- email/password sign-in;
- password reset;
- email OTP entry;
- session restore and sign-out;
- accessible loading/error/success states;
- demo mode that is explicit, disableable and separate from the production adapter.

No fake credential validation is permitted. The authentication threshold is now implemented; production Supabase provider configuration and RLS verification remain integration work.

## 5. MainHub boundary

Frontend adapter: `assets/js/integrations/mainhub.js`.

MainHub is the live-work system; Atlas is the knowledge/reference system. Cross-links should therefore be explicit context transitions, not duplicated live business state.

Supported contract intents:

```js
resolveReturnDestination({ context })
resolveProductDestination({ productId })
resolveSupplierDestination({ supplierId })
resolveFinanceRecordDestination({ recordId })
resolveOperationalRecordDestination({ recordType, recordId })
```

Production expectations:
- configure the MainHub base URL externally rather than hard-coding an environment-specific domain into content;
- accept only known entity types;
- URL-encode identifiers;
- never pass secrets or confidential payloads in query strings;
- if a destination is not authorised, MainHub itself must enforce that denial;
- Atlas links are convenience/navigation, never an authorisation mechanism.

Patch 13 does not modify MainHub and embeds no production MainHub URL.

## 6. Slack boundary

Frontend descriptor: `assets/js/integrations/slack.js`.

The browser must **not** hold Slack bot tokens or signing secrets. Slack writes/search-shortcut responses belong behind a server-side integration.

Supported contract intents:

```js
notifyImportantUpdate({ updateId, audience })
notifyRequiredReading({ updateId, audience, dueAt })
notifyWeeklyDigest({ periodStart, periodEnd, audience })
respondToSearchShortcut({ actorId, query, channelContext })
createArticleLinkPayload({ contentType, contentId })
```

Server-side implementation expectations:
- re-resolve the requesting user and permissions before returning Atlas search material;
- avoid posting restricted titles/excerpts into channels whose membership does not match the content audience;
- include links back to Atlas rather than duplicating entire internal articles in Slack;
- log delivery failures without leaking provider payloads into the browser;
- treat notification acknowledgement separately from Atlas required-reading acknowledgement unless explicitly designed otherwise.

## 7. Gmail boundary

Frontend descriptor: `assets/js/integrations/gmail.js`.

Atlas may reference communication templates and procedures; it must not casually become an inbox reader.

Supported contract intents:

```js
resolveCommunicationTemplate({ templateId, context })
resolveProcedureReference({ procedureId })
requestDraft({ templateId, recipients, subjectContext, bodyContext })
```

Production expectations:
- use least-privilege OAuth scopes;
- perform provider-authorised draft creation behind a protected server boundary when possible;
- never expose mailbox history/content to Atlas merely to create a draft;
- never store Gmail access/refresh tokens in browser localStorage;
- require explicit user action before creating/sending communication;
- sending mail is **not** part of the Patch 13 contract.

## 8. Loading behaviour

Integration-aware UI should use a predictable state model:

1. `idle`
2. `loading`
3. `ready`
4. `empty` where valid
5. `error`

Loading must not erase already-safe content or cause layout jumps. Skeletons, where used, should preserve approximate geometry and respect reduced motion.

## 9. Error behaviour

Adapters should normalise provider errors to safe Atlas-facing categories instead of passing raw provider responses directly into UI.

Recommended categories:
- `AUTH_REQUIRED`
- `FORBIDDEN`
- `NOT_FOUND`
- `CONFLICT`
- `VALIDATION`
- `RATE_LIMITED`
- `OFFLINE`
- `PROVIDER_UNAVAILABLE`
- `INTEGRATION_DISABLED`
- `UNKNOWN`

Safe UI errors should contain a user-facing message, category/code and retry guidance where relevant. Detailed provider diagnostics belong in protected logs, not screen text.

Patch 13's inactive adapters use `ATLAS_INTEGRATION_DISABLED` so a developer cannot mistake a contract placeholder for a live integration.

## 10. Offline behaviour

The Patch 12 service worker caches the Atlas application shell only. Integration responses are network-only by default.

Production rules:
- do not add Supabase rows, signed Storage URLs, Slack results, Gmail data or MainHub responses to Cache Storage without a specific privacy/retention design;
- offline writes should not be silently queued for sensitive actions;
- if future progress/bookmark writes become queueable, they need conflict/version rules and explicit session ownership;
- logout/session expiry must invalidate any future user-specific offline persistence.

## 11. Adapter registry

`assets/js/integration-adapter.js` exposes:

```js
getIntegrationAdapter(name)
getIntegrationStatus()
integrationAdapters
integrationAdapterStatus
```

Current final-handoff state:
- data/integration adapter contracts: present;
- enabled data providers: none;
- live provider clients: none;
- production URLs/secrets: none;
- authentication UI/adapter boundary: implemented; production Supabase client: not configured.

Calling any provider method intentionally rejects with a typed integration-disabled error.

## 12. Production connection order

Recommended sequence after the static frontend is approved:

1. Establish production environments and secret management.
2. Design Supabase schema and RLS from the approved content/role model.
3. Connect the existing authentication adapter to the production Supabase client and profile resolution; disable demo mode.
4. Replace static content reads/search with RLS-authorised Supabase reads.
5. Migrate bookmarks/progress/acknowledgements from demo-local state.
6. Connect MainHub destinations with environment configuration.
7. Add server-side Slack integration and permission-aware notifications/search shortcut.
8. Add Gmail template/draft integration only if still required.
9. Run security, RLS, integration and device QA before exposing Atlas publicly.

## 13. Explicitly out of scope in Patch 13

- production SQL migrations;
- Supabase project changes;
- Row Level Security policy creation;
- Slack app installation or credentials;
- Gmail OAuth configuration;
- MainHub code changes;
- production domain configuration;
- production authentication provider configuration;
- live data writes.
