# MOSCATELLI ATLAS — Deployment Checklist

## Before deployment
- [ ] Replace temporary `atlas-temp-*` PWA icons with approved Atlas assets.
- [ ] Confirm final custom domain and HTTPS.
- [ ] Connect production Supabase authentication.
- [ ] Set `demoMode: false`.
- [ ] Remove/disable any development-only preview entry point from the production build.
- [ ] Move private content behind authenticated/RLS-protected data access; do not publicly deploy private JSON.
- [ ] Verify all database Row Level Security policies.
- [ ] Verify permission-aware Search.
- [ ] Configure CSP, Referrer-Policy, Permissions-Policy and appropriate HSTS/security headers at the host/CDN.
- [ ] Configure `Cache-Control: no-store` or equivalent for authenticated/private responses.
- [ ] Verify service-worker shell cache does not persist confidential user-specific payloads.
- [ ] Test safe service-worker update behaviour.

## Browser/device QA
- [ ] Current Chrome/Chromium desktop.
- [ ] Current Safari desktop.
- [ ] Current Firefox desktop.
- [ ] iPhone Safari portrait.
- [ ] Android Chrome portrait.
- [ ] Tablet portrait/landscape.
- [ ] 125%, 150%, 200% zoom.
- [ ] Increased OS/browser text size.
- [ ] `prefers-reduced-motion`.
- [ ] Keyboard-only navigation.
- [ ] Screen reader smoke test.
- [ ] Password manager/autofill test.
- [ ] Mobile keyboard test on auth/search forms.

## Authentication QA
- [ ] Valid sign-in.
- [ ] Invalid credentials.
- [ ] OTP/email-link path.
- [ ] Password reset.
- [ ] Existing session restore.
- [ ] Expired session.
- [ ] Sign-out.
- [ ] Multiple-tab/session state.
- [ ] Network interruption during auth.

## Release
- [ ] Demonstration policy content replaced/approved or clearly excluded.
- [ ] Final content owners/approvers and review dates verified.
- [ ] Analytics/logging/privacy review completed if telemetry is added.
- [ ] Backup/rollback plan prepared.
- [ ] Production smoke test completed after deployment.
