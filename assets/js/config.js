export const ATLAS_CONFIG = Object.freeze({
  appName: 'MOSCATELLI ATLAS',
  version: '1.0.0-production',
  environment: 'production',

  // Preview mode is an explicit, isolated convenience path. It is NOT security.
  // Set demoMode:false when connecting the real Supabase authentication provider.
  demoMode: false,
  authenticationEnabled: true,
  authProvider: 'supabase',

  defaultRoute: '/home',
  integrations: Object.freeze({
    supabase: true,
    slack: true,
    mainHub: false,
    gmail: false,
  }),
  supabase: Object.freeze({
    url: 'https://htxzyqjynthuxrhnfcrj.supabase.co',
    publishableKey: 'sb_publishable_TIHcoDVmM3gezwSce3SA6g_QY8clFCB',
  }),
});
