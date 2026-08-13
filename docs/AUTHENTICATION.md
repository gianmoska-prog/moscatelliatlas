# MOSCATELLI ATLAS — Authentication

## Final frontend handoff state
Atlas now has a complete authentication threshold UI and a production-shaped authentication adapter boundary. **The supplied archive does not connect to production Supabase and is not production security by itself.**

### Current preview configuration
`assets/js/config.js` ships with:

- `authenticationEnabled: true`
- `demoMode: true`
- `authProvider: 'supabase'`

When demo mode is enabled, the authentication threshold visibly identifies itself as a **Development preview** and exposes a dedicated **Enter Atlas demo** control. This creates only an isolated `sessionStorage` demo session. It does not accept or validate credentials.

The ordinary Email + Password, Email OTP and Password Reset forms are still present so the real interface can be inspected. Until a provider is configured they return an explicit provider-unavailable error.

## Files

### `assets/js/auth-adapter.js`
Vendor-light contract for:

- `getSession()`
- `signInWithPassword({ email, password })`
- `signInWithOtp({ email, emailRedirectTo })`
- `resetPasswordForEmail({ email, redirectTo })`
- `signOut()`
- `onAuthStateChange(listener)`
- `configureAuthAdapter(client)`

It expects a Supabase-compatible browser client but imports no SDK and embeds no credentials.

### `assets/js/auth-provider.js`
The single future provider-bootstrap file. It is intentionally inert in this archive. Production integration should construct/import the MOSCATELLI Supabase browser client here and pass it to `configureAuthAdapter(client)`.

### `assets/js/auth-gate.js`
Owns the visible threshold, demo-session isolation, loading/error/success state, focus containment, session snapshot and sign-out transition.

### `assets/css/auth.css`
Owns authentication/profile presentation and mobile/reduced-motion/forced-colour behaviour.

## Production connection sequence

1. Obtain the existing MOSCATELLI Supabase project URL and **publishable/anon browser key** through the approved deployment-secret/configuration process. Never add a service-role key to frontend code.
2. Update `assets/js/auth-provider.js` to create or import the browser Supabase client.
3. Call `configureAuthAdapter(client)` before the gate checks for a session.
4. Change `demoMode` to `false` in production configuration.
5. Keep `authenticationEnabled: true`.
6. Connect the authenticated profile/role record.
7. Implement and verify database Row Level Security for every restricted entity before private production content is exposed.
8. Replace local demo bookmarks/progress/history/acknowledgements with authenticated persistence only after RLS is verified.
9. Run real password, OTP, reset, session refresh, sign-out and expired-session tests.
10. Run an independent security review before public deployment.

## Important security boundary
A frontend authentication screen cannot protect static JSON that is publicly deployed. **Private production content must not be shipped as publicly readable static files.** Content and search results must move behind permission-aware Supabase/RLS boundaries before Atlas is exposed publicly.

## Password handling
Atlas does not implement password-strength rules or fake password validation. Password validation and policy belong to the connected authentication provider.

## Demo session
The demo authentication key is:

`moscatelli.atlas.demo.auth-session.v1`

It uses `sessionStorage`, not persistent application storage, and is distinct from `moscatelli.atlas.demo.*` local preference/progress data.
