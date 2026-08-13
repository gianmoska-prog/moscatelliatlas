import { getCategories, getSearchableItems, loadSearchableItem } from './content-service.js';
import { getSupabaseClient } from './auth-adapter.js';
import { getLocale } from './i18n.js';

/**
 * Atlas local Search implementation (expanded through Patch 09).
 *
 * This module deliberately owns search semantics rather than UI. The interface
 * can later swap this adapter for Supabase/PostgreSQL full-text search without
 * changing the route or result rendering contract.
 */

const SYNONYM_GROUPS = Object.freeze([
  Object.freeze(['supplier', 'vendor']),
  Object.freeze(['bill', 'invoice']),
  Object.freeze(['cost', 'expense']),
  Object.freeze(['sample', 'prototype']),
  Object.freeze(['staff', 'team']),
  Object.freeze(['login', 'signin', 'access']),
  Object.freeze(['shipping', 'delivery']),
  Object.freeze(['policy', 'procedure', 'standard']),
]);

const STOP_WORDS = new Set(['a', 'an', 'and', 'are', 'as', 'at', 'be', 'for', 'from', 'how', 'in', 'is', 'it', 'of', 'on', 'or', 'the', 'to', 'what', 'with']);
let localIndexPromise = null;

export function normaliseSearchText(value = '') {
  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘]/g, "'")
    .toLocaleLowerCase('en')
    .replace(/[^a-z0-9'&+\-\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokeniseSearchText(value = '') {
  return normaliseSearchText(value)
    .split(/\s+/)
    .map((token) => token.replace(/^[-']+|[-']+$/g, ''))
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function expandTerms(query) {
  const normalisedQuery = normaliseSearchText(query);
  const original = tokeniseSearchText(normalisedQuery);
  const expanded = [...original];

  SYNONYM_GROUPS.forEach((group) => {
    if (group.some((term) => normalisedQuery.includes(term) || original.includes(term))) {
      group.forEach((term) => expanded.push(term));
    }
  });

  // Multi-word language from the brief is represented as index-friendly tokens.
  if (normalisedQuery.includes('sign in')) expanded.push('signin', 'login', 'access');
  if (normalisedQuery.includes('log in')) expanded.push('login', 'access');

  return Object.freeze({
    phrase: normalisedQuery,
    original: Object.freeze(unique(original)),
    expanded: Object.freeze(unique(expanded)),
  });
}

function blockText(block) {
  if (!block || typeof block !== 'object') return '';
  switch (block.type) {
    case 'paragraph': return block.text || '';
    case 'list':
    case 'checklist': return (block.items || []).join(' ');
    case 'procedure': return (block.steps || []).map((step) => `${step.title || ''} ${step.text || ''}`).join(' ');
    case 'callout': return `${block.label || ''} ${block.text || ''}`;
    case 'quote': return `${block.text || ''} ${block.attribution || ''}`;
    default: return '';
  }
}

function articleBodyText(article) {
  return (article.sections || [])
    .map((section) => `${section.heading || ''} ${(section.blocks || []).map(blockText).join(' ')}`)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function playbookBodyText(playbook) {
  const inform = (playbook.whoToInform || []).map((entry) => `${entry.role || ''} ${entry.when || ''}`).join(' ');
  const resources = (playbook.templatesResources || []).map((entry) => `${entry.kind || ''} ${entry.label || ''} ${entry.text || ''}`).join(' ');
  return [
    playbook.scenario || '',
    ...(playbook.immediateAction || []),
    inform,
    ...(playbook.whatToRecord || []),
    ...(playbook.escalationConditions || []),
    resources,
  ].join(' ').replace(/\s+/g, ' ').trim();
}

function academiaLessonBodyText(lesson) {
  return articleBodyText(lesson || {});
}

function searchableBodyText(item, document) {
  if (item.type === 'playbook') return playbookBodyText(document || {});
  if (item.type === 'academia-lesson') return academiaLessonBodyText(document || {});
  if (item.type === 'update') return `${document.changeSummary || ''} ${document.summary || ''} ${document.eyebrow || ''} ${document.updateType || ''} ${document.changeKind || ''}`;
  return articleBodyText(document || {});
}

function searchableHeadings(item, document) {
  if (item.type === 'playbook') return 'Scenario Immediate action Who to inform What to record Escalation conditions Templates resources Related procedures';
  if (item.type === 'update') return 'Update change summary effective date required reading acknowledgement';
  return (document.sections || []).map((section) => section.heading || '').join(' ');
}

function occurrenceCount(text, term) {
  if (!text || !term) return 0;
  let count = 0;
  let cursor = 0;
  while ((cursor = text.indexOf(term, cursor)) !== -1) {
    count += 1;
    cursor += Math.max(1, term.length);
    if (count >= 8) break;
  }
  return count;
}

function prepareRecord(item, document, categoryName) {
  const body = searchableBodyText(item, document);
  const headings = searchableHeadings(item, document);
  const keywords = (item.keywords || document.keywords || []).join(' ');
  const fields = Object.freeze({
    title: normaliseSearchText(item.title),
    summary: normaliseSearchText(item.summary),
    keywords: normaliseSearchText(keywords),
    category: normaliseSearchText(categoryName),
    topic: normaliseSearchText(item.topic),
    headings: normaliseSearchText(headings),
    body: normaliseSearchText(body),
  });

  return Object.freeze({
    id: item.id,
    slug: item.slug,
    type: item.type,
    route: item.type === 'playbook' ? `/playbook/${item.slug}` : item.type === 'academia-lesson' ? `/academia/${item.slug}` : item.type === 'update' ? `/updates?focus=${encodeURIComponent(item.slug)}` : `/article/${item.slug}`,
    typeLabel: item.type === 'playbook' ? 'Playbook' : item.type === 'academia-lesson' ? 'Lesson' : item.type === 'update' ? 'Update' : 'Reference',
    category: item.category,
    categoryName,
    topic: item.topic,
    eyebrow: item.eyebrow,
    title: item.title,
    summary: item.summary,
    keywords: Object.freeze([...(item.keywords || [])]),
    readingMinutes: item.readingMinutes,
    version: item.version,
    status: item.status,
    audience: Object.freeze([...(item.audience || [])]),
    permissions: Object.freeze([...(item.permissions || [])]),
    demo: Boolean(item.demo),
    body,
    headings,
    fields,
  });
}

export async function buildLocalSearchIndex() {
  if (!localIndexPromise) {
    localIndexPromise = Promise.all([getCategories(), getSearchableItems()]).then(async ([categories, items]) => {
      const categoryNames = new Map(categories.map((category) => [category.slug, category.name]));
      const documents = await Promise.all(items.map((item) => loadSearchableItem(item).catch(() => null)));
      return Object.freeze(items.map((item, index) => prepareRecord(item, documents[index] || item, categoryNames.get(item.category) || item.category)));
    }).catch((error) => {
      localIndexPromise = null;
      throw error;
    });
  }
  return localIndexPromise;
}

async function searchDatabase(terms) {
  if (getLocale() !== 'en') return null;
  const client = getSupabaseClient();
  if (!client) return null;
  const searchQuery = terms.expanded.join(' OR ');
  const [{ data, error }, categories] = await Promise.all([
    client.rpc('atlas_search', { search_query: searchQuery, result_limit: 100 }),
    getCategories(),
  ]);
  if (error) throw error;
  const categoryNames = new Map(categories.map((category) => [category.slug, category.name]));
  return (data || []).map((row) => {
    const item = { ...(row.metadata || {}), id: row.id, slug: row.slug, type: row.content_type,
      category: row.category_slug, title: row.title, summary: row.summary, topic: row.topic,
      status: row.status, version: row.version, audience: row.audience || [], permissions: row.permissions || [],
      keywords: row.keywords || [], readingMinutes: row.reading_minutes, demo: row.is_demo };
    return prepareRecord(item, row.document || item, categoryNames.get(item.category) || item.category);
  });
}

function scoreRecord(record, terms) {
  const { fields } = record;
  const matchFields = new Set();
  let score = 0;
  const phrase = terms.phrase;

  if (phrase) {
    if (fields.title === phrase) { score += 220; matchFields.add('title'); }
    else if (fields.title.startsWith(phrase)) { score += 150; matchFields.add('title'); }
    else if (fields.title.includes(phrase)) { score += 115; matchFields.add('title'); }
    if (fields.keywords.includes(phrase)) { score += 82; matchFields.add('keywords'); }
    if (fields.topic.includes(phrase)) { score += 72; matchFields.add('topic'); }
    if (fields.category.includes(phrase)) { score += 60; matchFields.add('category'); }
    if (fields.summary.includes(phrase)) { score += 54; matchFields.add('summary'); }
    if (fields.headings.includes(phrase)) { score += 34; matchFields.add('headings'); }
    if (fields.body.includes(phrase)) { score += 22; matchFields.add('body'); }
  }

  terms.expanded.forEach((term) => {
    const isOriginal = terms.original.includes(term);
    const synonymFactor = isOriginal ? 1 : 0.72;
    const titleHits = occurrenceCount(fields.title, term);
    const keywordHits = occurrenceCount(fields.keywords, term);
    const topicHits = occurrenceCount(fields.topic, term);
    const categoryHits = occurrenceCount(fields.category, term);
    const summaryHits = occurrenceCount(fields.summary, term);
    const headingHits = occurrenceCount(fields.headings, term);
    const bodyHits = occurrenceCount(fields.body, term);

    if (titleHits) { score += 34 * synonymFactor + Math.min(titleHits, 2) * 4; matchFields.add('title'); }
    if (keywordHits) { score += 27 * synonymFactor + Math.min(keywordHits, 2) * 3; matchFields.add('keywords'); }
    if (topicHits) { score += 22 * synonymFactor; matchFields.add('topic'); }
    if (categoryHits) { score += 17 * synonymFactor; matchFields.add('category'); }
    if (summaryHits) { score += 15 * synonymFactor + Math.min(summaryHits, 3) * 2; matchFields.add('summary'); }
    if (headingHits) { score += 12 * synonymFactor; matchFields.add('headings'); }
    if (bodyHits) { score += Math.min(bodyHits, 5) * 4 * synonymFactor; matchFields.add('body'); }
  });

  // Reward records that satisfy more of the user's literal terms.
  const searchable = `${fields.title} ${fields.summary} ${fields.keywords} ${fields.topic} ${fields.category} ${fields.headings} ${fields.body}`;
  const originalMatches = terms.original.filter((term) => searchable.includes(term)).length;
  if (terms.original.length && originalMatches === terms.original.length) score += 28 + terms.original.length * 5;
  else if (originalMatches) score += originalMatches * 3;

  return { score, matchFields: [...matchFields], originalMatches };
}

function makeExcerpt(record, terms, maxLength = 210) {
  const source = record.body || record.summary || '';
  if (!source) return '';
  const lower = source.toLocaleLowerCase('en');
  const candidates = terms.expanded.map((term) => lower.indexOf(term)).filter((index) => index >= 0);
  const firstMatch = candidates.length ? Math.min(...candidates) : 0;
  const half = Math.floor(maxLength / 2);
  let start = Math.max(0, firstMatch - half);
  let end = Math.min(source.length, start + maxLength);
  if (end - start < maxLength) start = Math.max(0, end - maxLength);

  if (start > 0) {
    const nextSpace = source.indexOf(' ', start);
    if (nextSpace > start && nextSpace - start < 28) start = nextSpace + 1;
  }
  if (end < source.length) {
    const previousSpace = source.lastIndexOf(' ', end);
    if (previousSpace > start) end = previousSpace;
  }
  return `${start > 0 ? '…' : ''}${source.slice(start, end).trim()}${end < source.length ? '…' : ''}`;
}

export async function searchAtlas(query, options = {}) {
  const cleanQuery = String(query || '').trim();
  const terms = expandTerms(cleanQuery);
  const category = options.category || null;
  const limit = Number.isFinite(options.limit) ? Math.max(1, Math.min(100, options.limit)) : 50;
  const canAccess = typeof options.canAccess === 'function' ? options.canAccess : () => true;

  if (!cleanQuery || !terms.expanded.length) {
    return Object.freeze({ query: cleanQuery, total: 0, terms, results: Object.freeze([]) });
  }

  const records = await searchDatabase(terms) || await buildLocalSearchIndex();
  const ranked = records
    .filter((record) => !category || record.category === category)
    .filter(canAccess)
    .map((record) => ({ record, ...scoreRecord(record, terms) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || b.originalMatches - a.originalMatches || a.record.title.localeCompare(b.record.title));
  const total = ranked.length;
  const results = ranked.slice(0, limit).map((entry) => Object.freeze({
      ...entry.record,
      score: Math.round(entry.score * 10) / 10,
      matchFields: Object.freeze(entry.matchFields),
      excerpt: makeExcerpt(entry.record, terms),
    }));

  return Object.freeze({
    query: cleanQuery,
    total,
    terms,
    results: Object.freeze(results),
  });
}

export function getSearchSynonyms() {
  return SYNONYM_GROUPS.map((group) => [...group]);
}

export function resetSearchIndex() {
  localIndexPromise = null;
}

export const resetLocalSearchIndexForTesting = resetSearchIndex;

export const searchStatus = Object.freeze({
  implemented: true,
  source: 'supabase-permission-aware-full-text-search',
  fullText: true,
  synonyms: true,
  permissionFilterBoundary: true,
  futureSupabaseReplacement: true,
});
