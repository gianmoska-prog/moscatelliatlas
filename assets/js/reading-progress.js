import { readDemoJSON, writeDemoJSON } from './store.js';
import { getSupabaseClient } from './auth-adapter.js';

const STORAGE_KEY = 'reading-progress.v1';
let databaseProgress = null;

export async function hydrateReadingProgress() {
  const client = getSupabaseClient();
  if (!client) return;
  const { data, error } = await client.from('atlas_progress').select('progress,atlas_content!inner(slug)');
  if (error) throw error;
  databaseProgress = Object.fromEntries((data || []).map((row) => [row.atlas_content.slug, Number(row.progress)]));
}

export function getAllReadingProgress() {
  if (databaseProgress) return databaseProgress;
  const value = readDemoJSON(STORAGE_KEY, {});
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

export function getReadingProgress(slug) {
  if (!slug) return 0;
  const value = Number(getAllReadingProgress()[slug] || 0);
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function saveReadingProgress(slug, progress) {
  if (!slug) return false;
  const normalised = Math.min(1, Math.max(0, Number(progress) || 0));
  const all = getAllReadingProgress();
  all[slug] = Number(normalised.toFixed(4));
  if (databaseProgress) {
    databaseProgress = { ...all };
    void persistProgress(slug, normalised);
    return true;
  }
  return writeDemoJSON(STORAGE_KEY, all);
}

async function persistProgress(slug, progress) {
  const client = getSupabaseClient();
  const { data: content, error: lookupError } = await client.from('atlas_content').select('id').eq('slug', slug).single();
  if (lookupError) throw lookupError;
  const { error } = await client.from('atlas_progress').upsert({ content_id: content.id, progress, completed_at: progress >= 1 ? new Date().toISOString() : null, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export function trackReadingProgress({ slug, root, onUpdate } = {}) {
  if (!slug || !root) return () => {};

  let frame = 0;
  let lastStored = getReadingProgress(slug);

  const calculate = () => {
    frame = 0;
    const rect = root.getBoundingClientRect();
    const viewport = Math.max(window.innerHeight || 0, 1);
    const rootTop = window.scrollY + rect.top;
    const startScroll = Math.max(0, rootTop - viewport * 0.28);
    const endScroll = Math.max(startScroll + 1, rootTop + root.offsetHeight - viewport);
    const atDocumentEnd = window.scrollY + viewport >= document.documentElement.scrollHeight - 2;
    const progress = atDocumentEnd ? 1 : Math.min(1, Math.max(0, (window.scrollY - startScroll) / (endScroll - startScroll)));
    const rounded = Math.round(progress * 100);

    if (typeof onUpdate === 'function') onUpdate(progress, rounded);

    if (progress >= lastStored + 0.02 || (progress === 1 && lastStored < 1)) {
      saveReadingProgress(slug, progress);
      lastStored = progress;
    }
  };

  const queue = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(calculate);
  };

  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue, { passive: true });
  calculate();

  return () => {
    if (frame) window.cancelAnimationFrame(frame);
    window.removeEventListener('scroll', queue);
    window.removeEventListener('resize', queue);
  };
}

export const readingProgressStatus = Object.freeze({
  implemented: true,
  persistence: 'supabase-rls',
  productionPersistence: true,
});
