import { createAdapterDescriptor, createInactiveMethod } from './errors.js';

/** MainHub cross-link boundary. No MainHub production URL is embedded here. */
export const mainHubDescriptor = createAdapterDescriptor({
  name: 'mainHub',
  kind: 'internal-navigation',
  capabilities: [
    'return.resolve',
    'product.resolve',
    'supplier.resolve',
    'financeRecord.resolve',
    'operationalRecord.resolve',
  ],
});

export const mainHubAdapter = Object.freeze({
  ...mainHubDescriptor,
  resolveReturnDestination: createInactiveMethod('mainHub', 'resolveReturnDestination'),
  resolveProductDestination: createInactiveMethod('mainHub', 'resolveProductDestination'),
  resolveSupplierDestination: createInactiveMethod('mainHub', 'resolveSupplierDestination'),
  resolveFinanceRecordDestination: createInactiveMethod('mainHub', 'resolveFinanceRecordDestination'),
  resolveOperationalRecordDestination: createInactiveMethod('mainHub', 'resolveOperationalRecordDestination'),
});
