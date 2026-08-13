import { getSupabaseClient } from './auth-adapter.js';
import { getLocale } from './i18n.js';

/**
 * Local content service for the Atlas development preview.
 *
 * Patch 15 keeps static JSON network-fresh and outside application-controlled persistent caching. The interface remains source-agnostic so a future
 * Supabase adapter can fulfil the same calls under Row Level Security.
 */
let indexPromise = null;
const articlePromises = new Map();
const playbookPromises = new Map();
const coursePromises = new Map();
const lessonPromises = new Map();
let updatesPromise = null;
let academiaIndexPromise = null;

function databaseClient() { return getSupabaseClient(); }
function useEnglishDatabaseContent() { return Boolean(databaseClient()) && getLocale() === 'en'; }
function contentURL(relativePath) {
  const localePrefix = getLocale() === 'en' ? '' : `locales/${getLocale()}/`;
  return new URL(`../../content/${localePrefix}${relativePath}`, import.meta.url);
}
function rowItem(row) {
  return { ...(row.metadata || {}), id: row.id, slug: row.slug, type: row.content_type,
    category: row.category_slug, title: row.title, summary: row.summary, topic: row.topic,
    status: row.status, version: row.version, audience: row.audience || [], permissions: row.permissions || [],
    keywords: row.keywords || [], readingMinutes: row.reading_minutes, demo: row.is_demo };
}
async function dbRows(table, columns = '*') {
  const { data, error } = await databaseClient().from(table).select(columns);
  if (error) throw error;
  return data || [];
}
async function dbDocument(type, slug) {
  const { data, error } = await databaseClient().from('atlas_content').select('document').eq('content_type', type).eq('slug', slug).single();
  if (error) throw error;
  return data.document;
}

function validateIndex(data) {
  if (!data || typeof data !== 'object') throw new TypeError('Atlas content index must be an object.');
  if (!Array.isArray(data.categories)) throw new TypeError('Atlas content index requires a categories array.');
  if (!Array.isArray(data.items)) throw new TypeError('Atlas content index requires an items array.');
  return data;
}

async function readJSON(url) {
  const response = await fetch(url, { credentials: 'same-origin', cache: 'no-store' });
  if (!response.ok) throw new Error(`Atlas content request failed (${response.status}).`);
  return response.json();
}

export async function loadContentIndex() {
  if (useEnglishDatabaseContent()) {
    if (!indexPromise) indexPromise = Promise.all([
      dbRows('atlas_categories', 'slug,name,short_name,description,topics,sort_order'),
      dbRows('atlas_content', 'id,slug,content_type,category_slug,title,summary,topic,status,version,audience,permissions,keywords,reading_minutes,metadata,is_demo'),
    ]).then(([categories, items]) => validateIndex({
      schemaVersion: 5,
      contentStatus: 'database',
      categories: categories.sort((a,b) => a.sort_order-b.sort_order).map((row) => ({ slug: row.slug, name: row.name, shortName: row.short_name, description: row.description, topics: row.topics || [] })),
      items: items.map(rowItem),
    })).catch((error) => { indexPromise = null; throw error; });
    return indexPromise;
  }
  if (window.__ATLAS_CONTENT__) return validateIndex(window.__ATLAS_CONTENT__);
  if (!indexPromise) {
    const url = contentURL('index.json');
    indexPromise = readJSON(url).then(validateIndex).catch((error) => { indexPromise = null; throw error; });
  }
  return indexPromise;
}

export async function getCategories() { const index = await loadContentIndex(); return index.categories; }
export async function getCategory(slug) { return (await getCategories()).find((category) => category.slug === slug) || null; }
export async function getLibraryItems({ category = null } = {}) { const items=(await loadContentIndex()).items.filter((item)=>item.type==='article'); return category ? items.filter((item)=>item.category===category) : items; }
export async function getArticleMetadata(slug) { return (await loadContentIndex()).items.find((item)=>item.type==='article'&&item.slug===slug)||null; }
export async function loadArticle(slug) {
  if (useEnglishDatabaseContent()) return dbDocument('article', slug);
  if (window.__ATLAS_ARTICLES__?.[slug]) return window.__ATLAS_ARTICLES__[slug];
  if (!articlePromises.has(slug)) { const url=contentURL(`articles/${encodeURIComponent(slug)}.json`); articlePromises.set(slug,readJSON(url).catch((error)=>{articlePromises.delete(slug);throw error;})); }
  return articlePromises.get(slug);
}
export async function getPlaybookItems({ category = null } = {}) { const items=(await loadContentIndex()).items.filter((item)=>item.type==='playbook'); return category ? items.filter((item)=>item.category===category) : items; }
export async function getPlaybookMetadata(slug) { return (await loadContentIndex()).items.find((item)=>item.type==='playbook'&&item.slug===slug)||null; }
export async function loadPlaybook(slug) {
  if (useEnglishDatabaseContent()) return dbDocument('playbook', slug);
  if (window.__ATLAS_PLAYBOOKS__?.[slug]) return window.__ATLAS_PLAYBOOKS__[slug];
  if (!playbookPromises.has(slug)) { const url=contentURL(`playbooks/${encodeURIComponent(slug)}.json`); playbookPromises.set(slug,readJSON(url).catch((error)=>{playbookPromises.delete(slug);throw error;})); }
  return playbookPromises.get(slug);
}
export async function getAcademiaCourses() {
  if (useEnglishDatabaseContent()) {
    const rows = await dbRows('atlas_courses', 'document,sort_order');
    return rows.sort((a,b)=>a.sort_order-b.sort_order).map((row)=>row.document);
  }
  if (window.__ATLAS_COURSES__) return Object.values(window.__ATLAS_COURSES__).sort((a,b) => (a.sortOrder || 999) - (b.sortOrder || 999));
  const indexUrl=contentURL('academia/index.json');
  if (!academiaIndexPromise) academiaIndexPromise=readJSON(indexUrl).catch((error)=>{academiaIndexPromise=null;throw error;});
  const academiaIndex=await academiaIndexPromise;
  return Promise.all((academiaIndex.courses||[]).map((course)=>loadAcademiaCourse(course.slug))).then((items)=>items.sort((a,b)=>(a.sortOrder || 999)-(b.sortOrder || 999)));
}
export async function loadAcademiaCourse(slug) {
  if (useEnglishDatabaseContent()) {
    const { data, error } = await databaseClient().from('atlas_courses').select('document').eq('slug', slug).single();
    if (error) throw error;
    return data.document;
  }
  if (window.__ATLAS_COURSES__?.[slug]) return window.__ATLAS_COURSES__[slug];
  if (!coursePromises.has(slug)) { const url=contentURL(`academia/course-${encodeURIComponent(slug)}.json`); coursePromises.set(slug,readJSON(url).catch((error)=>{coursePromises.delete(slug);throw error;})); }
  return coursePromises.get(slug);
}
export async function getAcademiaLessonMetadata(slug) { return (await loadContentIndex()).items.find((item)=>item.type==='academia-lesson'&&item.slug===slug)||null; }
export async function loadAcademiaLesson(slug) {
  if (useEnglishDatabaseContent()) return dbDocument('academia-lesson', slug);
  if (window.__ATLAS_LESSONS__?.[slug]) return window.__ATLAS_LESSONS__[slug];
  if (!lessonPromises.has(slug)) { const url=contentURL(`academia/lesson-${encodeURIComponent(slug)}.json`); lessonPromises.set(slug,readJSON(url).catch((error)=>{lessonPromises.delete(slug);throw error;})); }
  return lessonPromises.get(slug);
}
export async function resolveAcademiaPath(slug) {
  const courses=await getAcademiaCourses();
  const course=courses.find((item)=>item.slug===slug);
  if (course) return { kind:'course', document:course };
  const meta=await getAcademiaLessonMetadata(slug);
  if (meta) return { kind:'lesson', document:await loadAcademiaLesson(slug) };
  return null;
}

export async function getUpdates() {
  if (useEnglishDatabaseContent()) {
    if (!updatesPromise) updatesPromise = databaseClient().from('atlas_content').select('document').eq('content_type','update').then(({data,error})=>{if(error)throw error;return (data||[]).map((row)=>row.document);}).catch((error)=>{updatesPromise=null;throw error;});
    return updatesPromise;
  }
  if (window.__ATLAS_UPDATES__) return [...window.__ATLAS_UPDATES__];
  if (!updatesPromise) {
    const url = contentURL('updates/index.json');
    updatesPromise = readJSON(url).then((data) => Array.isArray(data?.updates) ? data.updates : []).catch((error) => { updatesPromise = null; throw error; });
  }
  return updatesPromise;
}

export async function getSearchableItems() { return (await loadContentIndex()).items.filter((item)=>['article','playbook','academia-lesson','update'].includes(item.type)); }
export async function loadSearchableItem(item) {
  if (item?.type==='playbook') return loadPlaybook(item.slug);
  if (item?.type==='article') return loadArticle(item.slug);
  if (item?.type==='academia-lesson') return loadAcademiaLesson(item.slug);
  if (item?.type==='update') return item;
  return null;
}
export const contentServiceStatus=Object.freeze({implemented:true,source:'supabase-rls',searchableTypes:Object.freeze(['article','playbook','academia-lesson','update']),supabaseReadyBoundary:true,permissionsEnforced:true});
