# MOSCATELLI ATLAS — Known Issues / Remaining Production Work

1. **Supabase is not connected in this archive.** The authentication and integration adapters are ready, but no live project URL/key/client is embedded.
2. **Demo mode is enabled for inspection.** It must be disabled for production.
3. **Static demonstration content is not a security boundary.** Real private content must move behind RLS-protected data access before public deployment.
4. **The demonstration content is not approved MOSCATELLI policy.** It exists to validate the interface and content model.
5. **Browser-level service-worker registration could not be tested in this execution environment** because direct local/file navigation is blocked by administrator policy. Service-worker code and cache boundaries were statically/harness tested instead.
6. **Physical Safari, Firefox, iOS and Android testing was not available.** Chromium responsive/reduced-motion tests were completed.
7. **Temporary Atlas PWA icons remain.** Replace them before brand approval.
8. **Production hosting headers are not part of a static source archive.** CSP/HSTS/cache/security headers must be configured on the final host/CDN.
9. **MainHub, Slack and Gmail adapters are intentionally inactive.**
10. **Local demo bookmarks/history/progress remain browser-local preview state.** Production persistence requires authenticated/RLS-protected storage.
