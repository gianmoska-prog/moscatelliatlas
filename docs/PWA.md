# MOSCATELLI ATLAS — PWA and Offline Policy

Status: Final frontend handoff architecture.

## Intent
Atlas is prepared to install as a Progressive Web App while keeping private knowledge conservative by default. The service worker exists to make the application shell resilient; it is **not** an offline replica of the internal knowledge base.

## What is cached
The versioned `atlas-shell-v1.0.0-static` cache contains only the application shell:
- `index.html` and the dedicated offline fallback;
- CSS and JavaScript modules;
- the web app manifest;
- temporary technical PWA icons.

## What is deliberately not cached
The service worker does not cache:
- anything below `content/`;
- future API responses;
- authentication requests;
- Supabase REST, Storage or Edge Function responses;
- user-specific records, bookmarks, history or progress from a production backend;
- Slack, Gmail or MainHub integration responses.

Local demo preferences continue to use the isolated `moscatelli.atlas.demo.*` localStorage namespace. They are development-preview state, not a PWA cache policy.

## Offline behaviour
When the browser loses connectivity:
1. The already-cached application shell can still open.
2. Home and shell-level navigation remain available.
3. A discreet status notice explains that current internal knowledge is not cached by default.
4. Routes requiring JSON knowledge show a safe offline-unavailable state rather than stale content.
5. A direct navigation failure falls back to the cached shell or `offline.html`.

This is intentionally more conservative than caching private articles indefinitely.

## Updates
The cache name is versioned. Activating a new service worker removes prior Atlas shell caches. When a new worker is installed while an older worker controls the page, Atlas offers a small `Reload` action. That action sends `SKIP_WAITING`; the page reloads after `controllerchange`.

## Installation
`manifest.webmanifest` uses `display: standalone`, `start_url: ./#/home` and `scope: ./`, making it compatible with GitHub Pages subpaths as well as a later custom domain. Installation still requires HTTPS in production (localhost is permitted during development).

The three files in `assets/icons/atlas-temp-*.png` are **temporary technical icons only**. They are intentionally replaceable and must not be treated as an approved MOSCATELLI or Atlas identity asset.

## Future production review
Before enabling production/private offline content, the next developer must define:
- which content classes, if any, may be persisted on-device;
- maximum retention and invalidation rules;
- logout/session-clearing behaviour;
- device-loss expectations;
- role/permission changes while cached content exists;
- encryption/device-management requirements if relevant.

Do not broaden the current service-worker cache to private content merely for convenience.


## Patch 15 transport-cache hardening

The service worker already excluded `content/`, authentication, Supabase REST/Storage/Functions and future API responses from Cache Storage. Patch 15 also requests those same-origin private/sensitive resources with `cache: "no-store"` so the application does not intentionally rely on the browser HTTP cache for internal knowledge or future authenticated provider responses.

This does **not** replace server-side cache headers. Production should still send appropriate `Cache-Control`, authentication and privacy headers from the serving infrastructure.


## Patch 16 authentication shell update
The public authentication UI code (`auth.css`, `auth-gate.js`, `auth-adapter.js`, `auth-provider.js`) is part of the application shell and may be cached. Authentication requests, provider responses, sessions and private data remain outside Cache Storage. Demo authentication uses `sessionStorage`, not the service-worker cache.
