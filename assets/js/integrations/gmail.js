import { createAdapterDescriptor, createInactiveMethod } from './errors.js?v=1.10.2';

/**
 * Gmail boundary.
 * Atlas is a knowledge/reference product, not an inbox client. The production
 * integration must not casually expose mailbox contents to Atlas. Draft or
 * template operations must use least-privilege authorisation server-side.
 */
export const gmailDescriptor = createAdapterDescriptor({
  name: 'gmail',
  kind: 'communication-reference',
  serverBoundary: true,
  capabilities: [
    'template.resolve',
    'procedureLink.resolve',
    'draft.request',
  ],
});

export const gmailAdapter = Object.freeze({
  ...gmailDescriptor,
  resolveCommunicationTemplate: createInactiveMethod('gmail', 'resolveCommunicationTemplate'),
  resolveProcedureReference: createInactiveMethod('gmail', 'resolveProcedureReference'),
  requestDraft: createInactiveMethod('gmail', 'requestDraft'),
});
