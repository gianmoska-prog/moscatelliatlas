# MOSCATELLI ATLAS

Production-connected build. See `docs/PRODUCTION_HANDOFF.md` for the completed Supabase/Slack integration and final deployment settings.

## Local verification

```powershell
npm.cmd ci
npm.cmd run check
npm.cmd run serve
```

**Knowledge, standards and practice.**

MOSCATELLI ATLAS is the private internal knowledge, education and reference platform for MOSCATELLI. MainHub runs the company; Atlas explains the company.

## Final frontend handoff — v1.0

The complete frontend implementation is now present:

- Minimal search-led Home: **What are you looking for?**
- Separate Browse navigation and manual Library research
- Library taxonomy and long-form article readers
- Ranked local full-text Search with synonyms and highlighted results
- Scenario-based Playbooks
- Academia courses, modules, lessons, progress and acknowledgements
- Updates, bookmarks, reading history and Continue Reading
- Purposeful motion and View Transitions progressive enhancement
- Responsive/zoom/accessibility hardening
- Installable-ready PWA shell with conservative private-data caching policy
- Production-shaped Supabase, MainHub, Slack and Gmail adapter contracts
- **Authentication threshold implemented last**, with password, email-code and reset interfaces
- Explicit isolated development-preview entry path
- Supabase-compatible authentication adapter and provider-bootstrap boundary
- Functional sign-out and session-aware Profile view

## Authentication preview

The archive intentionally ships with `demoMode: true` so it can be inspected without production credentials. The threshold visibly labels this as a **Development preview** and provides **Enter Atlas demo**. It does **not** validate credentials.

Read `docs/AUTHENTICATION.md` before connecting production access.

## Demonstration-content rule

All policy-like, operational and educational material in this preview is demonstration content for interface validation. It is not approved MOSCATELLI policy or a finished curriculum.

## Run locally

The modular project uses ES modules and JSON fetches, so serve it over HTTP:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080/#/home`.

For no-server visual inspection, use the supplied standalone final HTML preview delivered separately with this handoff.

## Production warning

The frontend authentication threshold is not sufficient to protect publicly deployed static private JSON. Before public production deployment:

- connect the existing MOSCATELLI Supabase users/profiles;
- set `demoMode: false`;
- move private content/search behind database-level Row Level Security;
- verify permission-aware Search and data access;
- configure production security/cache headers;
- complete independent security and physical-device/browser QA.

See `docs/FINAL_HANDOFF.md`, `docs/INTEGRATION_CHECKLIST.md` and `docs/DEPLOYMENT_CHECKLIST.md`.
