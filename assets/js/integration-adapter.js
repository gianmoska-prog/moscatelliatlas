/**
 * Central registry for future Atlas integrations.
 *
 * Patch 13 defines stable frontend boundaries only. Every provider remains
 * disabled and intentionally throws a typed error if invoked. No credentials,
 * production URLs or live provider clients are bundled in Atlas.
 */
import { supabaseAdapter } from './integrations/supabase.js?v=1.10.2';
import { mainHubAdapter } from './integrations/mainhub.js?v=1.10.2';
import { slackAdapter } from './integrations/slack.js?v=1.10.2';
import { gmailAdapter } from './integrations/gmail.js?v=1.10.2';

const adapters = Object.freeze({
  supabase: supabaseAdapter,
  mainHub: mainHubAdapter,
  slack: slackAdapter,
  gmail: gmailAdapter,
});

export const integrationAdapterStatus = Object.freeze({
  implemented: true,
  liveConnections: true,
  authenticationBoundaryImplemented: true,
});

export function getIntegrationAdapter(name) {
  const adapter = adapters[name];
  if (!adapter) throw new TypeError(`Unknown Atlas integration: ${name}`);
  return adapter;
}

export function getIntegrationStatus() {
  return Object.freeze(Object.fromEntries(
    Object.entries(adapters).map(([name, adapter]) => [name, Object.freeze({
      enabled: adapter.enabled,
      implemented: adapter.implemented,
      serverBoundary: adapter.serverBoundary,
      capabilities: adapter.capabilities,
    })]),
  ));
}

export const integrationAdapters = adapters;
