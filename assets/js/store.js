/**
 * Local development-preview storage boundary.
 *
 * Every key is explicitly namespaced as demo state so it cannot be confused
 * with future authenticated/production persistence. A tiny in-memory fallback
 * keeps preview continuity working when storage is unavailable or blocked.
 */
const DEMO_STORAGE_PREFIX = 'moscatelli.atlas.demo.';
const memoryFallback = new Map();

function keyFor(name) {
  return `${DEMO_STORAGE_PREFIX}${name}`;
}

export function readDemoJSON(name, fallback) {
  const key = keyFor(name);
  try {
    const raw = window.localStorage.getItem(key);
    if (raw !== null) return JSON.parse(raw);
  } catch {
    // Continue to the in-memory preview boundary below.
  }
  return memoryFallback.has(key) ? memoryFallback.get(key) : fallback;
}

export function writeDemoJSON(name, value) {
  const key = keyFor(name);
  memoryFallback.set(key, value);
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export const demoStorageStatus = Object.freeze({
  implemented: true,
  namespace: DEMO_STORAGE_PREFIX,
  productionPersistence: false,
  memoryFallback: true,
});
