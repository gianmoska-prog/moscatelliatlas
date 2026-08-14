import { getSupabaseClient } from '../auth-adapter.js?v=1.10.2';

/**
 * Slack boundary.
 * Provider credentials must never be placed in this browser application.
 * Production write/notification operations must execute through an authorised
 * server-side function or equivalent protected integration service.
 */
export const slackDescriptor = Object.freeze({
  name: 'slack', kind: 'notification', enabled: true, implemented: true,
  serverBoundary: true,
  capabilities: [
    'importantUpdate.notify',
    'requiredReading.notify',
    'weeklyDigest.notify',
    'searchShortcut.respond',
    'articleLink.create',
  ],
});

export const slackAdapter = Object.freeze({
  ...slackDescriptor,
  async notifyImportantUpdate({ updateId }) { return notify(updateId, 'important'); },
  async notifyRequiredReading({ updateId }) { return notify(updateId, 'required'); },
});

async function notify(contentId, kind) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase is not connected.');
  const { data, error } = await client.functions.invoke('atlas-slack', { body: { contentId, kind } });
  if (error) throw error;
  if (!data?.ok) throw new Error(data?.error || 'Slack delivery failed.');
  return data;
}
