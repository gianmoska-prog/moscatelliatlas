import { readDemoJSON, writeDemoJSON } from './store.js?v=1.10.2';

const HISTORY_STORAGE_KEY = 'reading-history.v1';
const MAX_ITEMS = 60;
function historyKeyFor(item) { return `${item?.type || 'reference'}:${item?.slug || ''}`; }

export function getReadingHistory() {
  const stored = readDemoJSON(HISTORY_STORAGE_KEY, []);
  return Array.isArray(stored) ? stored.filter((item) => item && item.slug && item.route) : [];
}

export function recordReadingHistory(item) {
  if (!item?.slug || !item?.route) return false;
  const key = historyKeyFor(item);
  const previous = getReadingHistory().filter((entry) => historyKeyFor(entry) !== key);
  return writeDemoJSON(HISTORY_STORAGE_KEY, [{ ...item, lastOpenedAt: new Date().toISOString() }, ...previous].slice(0, MAX_ITEMS));
}

export const readingHistoryStatus = Object.freeze({ implemented: true, persistence: 'demo-local-storage', maximumItems: MAX_ITEMS, productionPersistence: false });
