# MOSCATELLI ATLAS — CONTENT MODEL

## Status
Implemented for the local development preview through Patch 06. The model is production-shaped but the supplied entries are demonstration content, not final MOSCATELLI policy.

## Design goals
The content model must support:
- Stable deep links.
- Category and topic browsing.
- Governance and review metadata.
- Future role-aware permissions.
- Local full-text search with a future database replacement boundary.
- Article history/versioning in the eventual database.
- Long-form structured rendering without storing presentation-specific HTML as the primary source.

## Index
`content/index.json` is the lightweight browsing/search metadata source for the static preview.

Top-level fields:
- `schemaVersion`
- `generatedFor`
- `contentStatus`
- `notice`
- `categories[]`
- `items[]`

### Category
Each category contains:
- `slug` — stable URL identifier.
- `name` — full display name.
- `shortName` — compact navigation label.
- `description` — subject scope.
- `topics[]` — initial taxonomy from the brief.
- `permissionHint` — optional architectural note for sensitive areas.

Current canonical category slugs:
- `the-house`
- `brand`
- `products-and-quality`
- `operations`
- `suppliers`
- `finance-and-administration`
- `people`
- `systems`

### Index item
Each item contains:
- `id`
- `slug`
- `type`
- `category`
- `topic`
- `eyebrow`
- `title`
- `summary`
- `keywords[]`
- `readingMinutes`
- `owner`
- `approver`
- `version`
- `publishedDate`
- `lastReviewed`
- `nextReview`
- `languageStatus`
- `status`
- `audience[]`
- `permissions[]`
- `demo`

Supported governance status vocabulary for this preview:
- `current`
- `under-review`

The eventual platform must additionally support the complete editorial lifecycle: Draft → Review → Published → Superseded → Archived.

## Article documents
Full documents live at `content/articles/:slug.json` in the static preview. Each document repeats the browsing metadata deliberately so it remains understandable when inspected independently and adds:
- `contentNotice`
- `tableOfContents`
- `sections[]`
- `related[]`
- `mainHubLinks[]`

### Section model
A section contains:
- `heading`
- `blocks[]`

Section identifiers used by the reader are derived at render time from heading plus sequence. They are presentation/navigation identifiers and are not currently persisted in content.

### Block contract
Patch 05 renders the following semantic block types:

#### Paragraph
```json
{ "type": "paragraph", "text": "…" }
```

#### List
```json
{ "type": "list", "items": ["…", "…"] }
```

#### Checklist
```json
{ "type": "checklist", "items": ["…", "…"] }
```

Checklist marks are presentational in this patch; they are not interactive task-state controls.

#### Procedure
```json
{
  "type": "procedure",
  "steps": [
    { "title": "…", "text": "…" }
  ]
}
```

#### Callout
```json
{ "type": "callout", "label": "…", "text": "…" }
```

#### Quote
```json
{ "type": "quote", "text": "…" }
```

Future blocks may add downloads, templates, embedded system references or richer structured data. The primary content source should remain semantic rather than presentation-driven HTML.

## Related references
`related[]` contains article slugs. The reader resolves those slugs against `content/index.json` so link labels and governance metadata remain centrally indexed.

## Reading progress
Reading progress is not part of an article document. Patch 05 stores local development-preview progress through `assets/js/reading-progress.js` in the isolated `moscatelli.atlas.demo.*` storage namespace.

The eventual authenticated implementation should map progress to user/content identifiers through the Supabase adapter without changing the reader UI contract.

## Permission boundary
`permissions[]` is metadata, not security. The static preview does not know an authenticated user's role and therefore does not claim to enforce access restrictions.

The future Supabase implementation must:
1. Resolve the authenticated profile/role.
2. Apply Row Level Security at database level.
3. Return only content the user is allowed to read.
4. Ensure restricted content is absent from search results/previews as well as direct reads.
5. Treat frontend visibility rules as presentation only, never as the security boundary.

## Service boundary
`assets/js/content-service.js` currently fulfils UI requests from static JSON and exposes source-neutral functions including:
- `loadContentIndex()`
- `getCategories()`
- `getCategory(slug)`
- `getLibraryItems({ category })`
- `getArticleMetadata(slug)`
- `loadArticle(slug)`

The UI consumes those methods rather than importing JSON structure directly. A future Supabase-backed implementation should preserve equivalent behaviour so route/page code does not need to be rewritten.

## Demonstration content
Patch 05 includes twelve references with expanded structured bodies specifically to verify typography, table-of-contents behaviour, procedure/checklist rendering, governance and related navigation. Every policy-like entry carries `demo: true` and a visible `contentNotice`.

## Patch 06 derived Search model
Patch 06 introduces `assets/js/search.js` as a source-neutral retrieval adapter. It does not change the authoritative article documents. Instead it derives an in-memory record for each searchable article containing:
- stable ID and slug;
- category/category display name and topic;
- title, summary, keywords and governance-facing display metadata;
- normalised section headings;
- flattened text from semantic article blocks;
- audience and permissions metadata for a future visibility filter.

The current local search adapter indexes block text from paragraphs, lists, checklists, procedures, callouts and quotations. Search data is regenerated from the content service and is not persisted as a second source of truth.

### Ranking contract
The local preview uses deterministic weighted lexical relevance:
1. exact or leading title phrase;
2. title tokens;
3. keywords, topic and category;
4. summary and section-heading matches;
5. body-text occurrences.

Literal query terms receive more weight than synonym-only matches. Records matching all literal query terms receive an additional relevance reward.

### Initial synonym groups
- supplier / vendor
- bill / invoice
- cost / expense
- sample / prototype
- staff / team
- login / sign in / access
- shipping / delivery
- policy / procedure / standard

The UI consumes `searchAtlas(query, options)` rather than implementing ranking itself. A future Supabase/PostgreSQL full-text implementation should preserve the result contract while moving ranking, permission filtering and language-aware retrieval to the database/search layer.

### Search permission rule
The local adapter exposes a `canAccess(record)` filter boundary but the static preview supplies no authenticated role. It therefore does **not** claim to secure sensitive results. Production Search must receive only RLS-authorised records; restricted titles, summaries, excerpts and body text must never be sent to an unauthorised client merely to be hidden by JavaScript.


## Patch 07 — Playbook document model
Playbooks are indexed alongside articles but retain a distinct scenario model. Each playbook contains `scenario`, `immediateAction[]`, `whoToInform[]`, `whatToRecord[]`, `escalationConditions[]`, `templatesResources[]`, `relatedProcedures[]`, governance metadata, audience and future permissions. Search derives plain text from these fields without flattening the source documents into article-shaped content.

`templatesResources[]` may contain a static explanatory resource or a local Atlas route. Controls are only rendered when the target route is functional.


## Academia model — Patch 08
Academia is represented by `academia-course` and `academia-lesson` documents. Courses own ordered modules; modules reference lesson slugs. Lessons carry requirement state (`required` or `optional`), estimated time, optional acknowledgement requirement, governance metadata and structured reading sections. The global content index contains lesson metadata so Search can include Academia without loading course structure first.

Demo completion and acknowledgement are not content fields. They are local user-state stored under the namespaced development-preview storage boundary and are expected to move to authenticated Supabase progress/acknowledgement entities later.

## Patch 13 — production data adapter boundary
`assets/js/integrations/supabase.js` now defines the future production-facing data operations for content, search, bookmarks, progress, acknowledgements, updates, authorised Storage references and audit events. The current static `content-service.js` and local Search remain active for the preview; the Supabase adapter is deliberately disabled.

The future migration should preserve existing route/content semantics while replacing static reads with RLS-authorised data. User identity must be derived from the authenticated session rather than trusted from arbitrary method parameters.
