/**
 * Shared Atlas integration errors.
 *
 * These are public frontend errors only. They must never contain credentials,
 * raw provider responses, mailbox contents or other sensitive payloads.
 */
export class AtlasIntegrationError extends Error {
  constructor(message, { code = 'ATLAS_INTEGRATION_ERROR', integration = 'unknown', retryable = false } = {}) {
    super(message);
    this.name = 'AtlasIntegrationError';
    this.code = code;
    this.integration = integration;
    this.retryable = Boolean(retryable);
  }
}

export class IntegrationDisabledError extends AtlasIntegrationError {
  constructor(integration, operation) {
    super(`${integration} integration is not enabled for this Atlas build.`, {
      code: 'ATLAS_INTEGRATION_DISABLED',
      integration,
      retryable: false,
    });
    this.name = 'IntegrationDisabledError';
    this.operation = operation;
  }
}

export class IntegrationNotImplementedError extends AtlasIntegrationError {
  constructor(integration, operation) {
    super(`${integration}.${operation} is defined by the Atlas contract but has no production implementation yet.`, {
      code: 'ATLAS_INTEGRATION_NOT_IMPLEMENTED',
      integration,
      retryable: false,
    });
    this.name = 'IntegrationNotImplementedError';
    this.operation = operation;
  }
}

export function createInactiveMethod(integration, operation) {
  return async function inactiveIntegrationMethod() {
    throw new IntegrationDisabledError(integration, operation);
  };
}

export function createAdapterDescriptor({ name, kind, capabilities, serverBoundary = false }) {
  return Object.freeze({
    name,
    kind,
    enabled: false,
    implemented: false,
    serverBoundary: Boolean(serverBoundary),
    capabilities: Object.freeze([...capabilities]),
  });
}
