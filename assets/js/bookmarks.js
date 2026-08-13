import { readDemoJSON, writeDemoJSON } from './store.js';
import { getSupabaseClient } from './auth-adapter.js';

const BOOKMARK_STORAGE_KEY = 'bookmarks.v1';
let databaseBookmarks = null;

export async function hydrateBookmarks() {
  const client = getSupabaseClient();
  if (!client) return;
  const { data, error } = await client.from('atlas_bookmarks').select('metadata,created_at');
  if (error) throw error;
  databaseBookmarks = (data || []).map((row) => ({ ...row.metadata, savedAt: row.created_at }));
}

function bookmarkKeyFor(item) { return `${item?.type || 'reference'}:${item?.slug || ''}`; }

export function getBookmarks() {
  if (databaseBookmarks) return [...databaseBookmarks];
  const stored = readDemoJSON(BOOKMARK_STORAGE_KEY, []);
  return Array.isArray(stored) ? stored.filter((item) => item && item.slug && item.route) : [];
}

export function isBookmarked(type, slug) {
  const key = `${type || 'reference'}:${slug || ''}`;
  return getBookmarks().some((item) => bookmarkKeyFor(item) === key);
}

export function toggleBookmark(item) {
  if (!item?.slug || !item?.route) return { saved: false, items: getBookmarks() };
  const items = getBookmarks();
  const key = bookmarkKeyFor(item);
  const existing = items.findIndex((entry) => bookmarkKeyFor(entry) === key);
  if (existing >= 0) {
    items.splice(existing, 1);
    if (databaseBookmarks) {
      databaseBookmarks = items;
      void persistBookmark(item, false);
      return { saved: false, items };
    }
    writeDemoJSON(BOOKMARK_STORAGE_KEY, items);
    return { saved: false, items };
  }
  const record = { ...item, savedAt: new Date().toISOString() };
  const next = [record, ...items].slice(0, 100);
  if (databaseBookmarks) {
    databaseBookmarks = next;
    void persistBookmark(record, true);
    return { saved: true, items: next };
  }
  writeDemoJSON(BOOKMARK_STORAGE_KEY, next);
  return { saved: true, items: next };
}

async function persistBookmark(item, saved) {
  const client = getSupabaseClient();
  const { data: content, error: lookupError } = await client.from('atlas_content').select('id').eq('content_type', item.type).eq('slug', item.slug).single();
  if (lookupError) throw lookupError;
  const operation = saved
    ? client.from('atlas_bookmarks').upsert({ content_id: content.id, metadata: item })
    : client.from('atlas_bookmarks').delete().eq('content_id', content.id);
  const { error } = await operation;
  if (error) throw error;
}

export const bookmarkStatus = Object.freeze({ implemented: true, persistence: 'supabase-rls', productionPersistence: true });
