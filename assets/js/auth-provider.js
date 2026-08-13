import { createClient } from '../vendor/supabase.js';
import { ATLAS_CONFIG } from './config.js';
import { configureAuthAdapter, getAuthAdapterStatus } from './auth-adapter.js';

/**
 * Provider bootstrap boundary.
 *
 * FINAL FRONTEND HANDOFF STATE:
 * - no Supabase SDK is imported;
 * - no project URL or publishable key is embedded;
 * - no production client is constructed.
 *
 * Future production integration should create the MOSCATELLI Supabase browser
 * client here, call `configureAuthAdapter(client)`, then return the configured
 * adapter status. Keeping this in one file avoids coupling app.js to a vendor SDK.
 */
export async function prepareAuthProvider() {
  const { url, publishableKey } = ATLAS_CONFIG.supabase || {};
  if (!url || !publishableKey) return getAuthAdapterStatus();
  const client = createClient(url, publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    global: { headers: { 'X-Client-Info': `moscatelli-atlas/${ATLAS_CONFIG.version}` } },
  });
  configureAuthAdapter(client);
  window.__ATLAS_SUPABASE__ = client;
  return getAuthAdapterStatus();
}
