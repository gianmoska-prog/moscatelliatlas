import { ATLAS_CONFIG } from './config.js';
import { initPWA } from './pwa.js';
import { navigate, startRouter } from './router.js';
import { readDemoJSON, writeDemoJSON } from './store.js';
import { getAcademiaCourses, getAcademiaLessonMetadata, getArticleMetadata, getCategories, getCategory, getLibraryItems, getPlaybookItems, getPlaybookMetadata, getUpdates, loadAcademiaCourse, loadAcademiaLesson, loadArticle, loadContentIndex, loadPlaybook, resolveAcademiaPath } from './content-service.js';
import { getReadingProgress, hydrateReadingProgress, trackReadingProgress } from './reading-progress.js';
import { getBookmarks, hydrateBookmarks, isBookmarked, toggleBookmark } from './bookmarks.js';
import { getAcknowledgements, hydrateAcknowledgements, setAcknowledgement } from './acknowledgements.js';
import { getReadingHistory, recordReadingHistory } from './history.js';
import { buildLocalSearchIndex, searchAtlas } from './search.js';
import { closeDialogWithMotion, commitRouteWithMotion, enhanceRouteReveals, prepareRouteMotion, pulseState } from './motion.js';
import { getAuthenticationSnapshot, initAuthenticationThreshold, signOutAtlas } from './auth-gate.js';
import { prepareAuthProvider } from './auth-provider.js';
import { initI18n, t } from './i18n.js';

initI18n();
import { slackAdapter } from './integrations/slack.js';

const outlet = document.querySelector('#app');
const main = document.querySelector('#main-content');
const routeStatus = document.querySelector('#atlas-route-status');
const menu = document.querySelector('#atlas-menu');
const menuOpeners = document.querySelectorAll('[data-menu-open]');
const menuCloser = document.querySelector('[data-menu-close]');
const globalSearchDialog = document.querySelector('#atlas-global-search');
const globalSearchOpeners = document.querySelectorAll('[data-global-search-open]');
const globalSearchCloser = document.querySelector('[data-global-search-close]');
let hasRenderedRoute = false;
let searchInteractionController = null;
let lastMenuOpener = null;
let routeInteractionController = null;
let renderSerial = 0;
let globalSearchRenderSerial = 0;
let lastGlobalSearchOpener = null;
let resolveFirstRouteReady;
const firstRouteReady = new Promise((resolve) => { resolveFirstRouteReady = resolve; });

document.documentElement.classList.add('js');
document.documentElement.dataset.atlasVersion = ATLAS_CONFIG.version;


function bindSkipLink() {
  const skipLink = document.querySelector('[data-skip-link]');
  if (!skipLink || !main) return;
  skipLink.addEventListener('click', (event) => {
    // Atlas uses the URL fragment for routing, so native #main-content navigation
    // would otherwise replace the active route. Focus the landmark directly.
    event.preventDefault();
    main.focus({ preventScroll: true });
    main.scrollIntoView({ block: 'start', behavior: 'auto' });
  });
}

const categoryNames = Object.freeze({
  'the-house': 'The House',
  'brand': 'Brand',
  'products-and-quality': 'Products & Quality',
  'operations': 'Operations',
  'suppliers': 'Suppliers',
  'finance-and-administration': 'Finance & Administration',
  'people': 'People',
  'systems': 'Systems',
});

const HOME_SEARCH_SUGGESTIONS = Object.freeze([
  Object.freeze({ label: 'Supplier sample review procedure', query: 'supplier sample review' }),
  Object.freeze({ label: 'Product naming standards', query: 'product naming standards' }),
  Object.freeze({ label: 'MainHub access troubleshooting', query: 'MainHub access troubleshooting' }),
  Object.freeze({ label: 'How MOSCATELLI records decisions', query: 'recording decisions' }),
]);

const RECENT_SEARCH_STORAGE = 'recent-searches.v1';
const MAX_RECENT_SEARCHES = 4;

function escapeHTML(value = '') {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  }[character]));
}

function readRecentSearches() {
  const stored = readDemoJSON(RECENT_SEARCH_STORAGE, []);
  if (!Array.isArray(stored)) return [];
  return stored
    .filter((item) => typeof item === 'string' && item.trim())
    .map((item) => item.trim())
    .slice(0, MAX_RECENT_SEARCHES);
}

function rememberSearch(query) {
  const clean = query.trim();
  if (!clean) return;
  const deduped = readRecentSearches().filter((item) => item.toLocaleLowerCase() !== clean.toLocaleLowerCase());
  writeDemoJSON(RECENT_SEARCH_STORAGE, [clean, ...deduped].slice(0, MAX_RECENT_SEARCHES));
}

function homeTemplate() {
  return `
    <section class="home-view" data-route-view="home" aria-labelledby="home-question">
      <div class="home-search-stage">
        <h1 id="home-question">What are you looking for?</h1>
        <div class="search-experience" data-search-experience>
          <form class="atlas-search-box" data-home-search-form role="search" novalidate>
            <label class="sr-only" for="atlas-home-search">Search Atlas</label>
            <span class="atlas-search-box__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="21" height="21"><path d="m21 21-4.35-4.35m1.35-5.15A6.5 6.5 0 1 1 5 11.5a6.5 6.5 0 0 1 13 0Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
            </span>
            <input id="atlas-home-search" name="q" type="search" autocomplete="off" spellcheck="false" placeholder="Search knowledge, standards and procedures" role="combobox" aria-autocomplete="list" aria-haspopup="listbox" aria-expanded="false" aria-controls="atlas-home-suggestions">
            <button class="search-submit" type="submit" aria-label="Search Atlas">
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M5 12h13m-5-5 5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </form>
          <div class="search-disclosure" id="atlas-home-suggestions" data-search-disclosure role="listbox" aria-label="Search suggestions" hidden></div>
        </div>
        <p id="search-preview-note" class="home-search-note" aria-live="polite"></p>
      </div>
    </section>`;
}

function placeholderTemplate({ eyebrow, title, summary, note = 'This route is part of the working application shell. Its full content experience is intentionally reserved for a later focused patch.' }) {
  return `
    <section class="route-page" aria-labelledby="route-title">
      <div class="route-page__inner">
        <div>
          <p class="route-eyebrow">${escapeHTML(eyebrow)}</p>
          <h1 id="route-title">${escapeHTML(title)}</h1>
          <p class="route-page__summary">${escapeHTML(summary)}</p>
          <a class="route-back" href="#/home" data-route-link aria-label="Return to Atlas home">← Return home</a>
        </div>
        <p class="route-page__aside"><strong>Preview status</strong>${escapeHTML(note)}</p>
      </div>
    </section>`;
}

function profileTemplate() {
  const auth = getAuthenticationSnapshot();
  const user = auth.user || {};
  const mode = auth.demo ? 'Development preview' : 'Authenticated provider';
  const email = user.email || (auth.demo ? 'Not used in demo mode' : '—');
  const role = user.role || (auth.demo ? 'Preview' : 'Profile role pending');
  return `
    <section class="route-page" aria-labelledby="profile-title">
      <div class="route-page__inner">
        <div>
          <p class="route-eyebrow">Personal</p>
          <h1 id="profile-title">Profile</h1>
          <p class="route-page__summary">Your current Atlas access context. Role and language preferences will be supplied by the connected profile record in production.</p>
          <div class="profile-auth-card">
            <dl>
              <div><dt>Session</dt><dd>${escapeHTML(mode)}</dd></div>
              <div><dt>Name</dt><dd>${escapeHTML(user.displayName || 'Atlas user')}</dd></div>
              <div><dt>Email</dt><dd>${escapeHTML(email)}</dd></div>
              <div><dt>Role</dt><dd>${escapeHTML(role)}</dd></div>
            </dl>
            <p class="profile-auth-card__note">${auth.demo ? 'This is isolated preview state. It does not represent a real MOSCATELLI account or production authorisation.' : 'Production permissions must still be enforced by Supabase Row Level Security, not by this visible profile state.'}</p>
            <button class="auth-signout" type="button" data-auth-signout>Sign out of Atlas</button>
          </div>
        </div>
        <p class="route-page__aside"><strong>Access boundary</strong>${auth.demo ? 'Demo mode is explicit and separate from the production authentication adapter.' : 'This session was supplied by the configured authentication provider.'}</p>
      </div>
    </section>`;
}



function personalItemKey(type, slug) { return `${type || 'reference'}:${slug || ''}`; }
function bookmarkButtonMarkup(item) {
  const saved = isBookmarked(item.type, item.slug);
  return `<button class="atlas-bookmark-button" type="button" data-bookmark-toggle data-bookmark-type="${escapeHTML(item.type)}" data-bookmark-slug="${escapeHTML(item.slug)}" data-bookmark-title="${escapeHTML(item.title)}" data-bookmark-summary="${escapeHTML(item.summary || '')}" data-bookmark-route="${escapeHTML(item.route)}" data-bookmark-context="${escapeHTML(item.context || '')}" aria-pressed="${saved}"><span aria-hidden="true">${saved ? '●' : '○'}</span><span data-bookmark-label>${saved ? 'Saved' : 'Save'}</span></button>`;
}
function formatRelativeDate(value) {
  if (!value) return 'Recently';
  const date = new Date(value); if (Number.isNaN(date.getTime())) return 'Recently';
  return new Intl.DateTimeFormat('en', { day:'numeric', month:'short', year:'numeric' }).format(date);
}
function personalListItemMarkup(item, { progress = null, history = false } = {}) {
  const progressMarkup = Number.isFinite(progress) ? `<span>${Math.round(progress * 100)}% read</span>` : '';
  return `<article class="personal-item"><a href="#${escapeHTML(item.route)}" data-route-link><span class="personal-item__context">${escapeHTML(item.context || item.typeLabel || item.type || 'Atlas')}</span><strong>${escapeHTML(item.title)}</strong><p>${escapeHTML(item.summary || '')}</p><div class="personal-item__meta">${progressMarkup}${history && item.lastOpenedAt ? `<span>Opened ${escapeHTML(formatRelativeDate(item.lastOpenedAt))}</span>` : ''}${item.savedAt ? `<span>Saved ${escapeHTML(formatRelativeDate(item.savedAt))}</span>` : ''}</div><i aria-hidden="true">↗</i></a></article>`;
}
function bookmarksTemplate() {
  const items=getBookmarks();
  return `<section class="personal-view" aria-labelledby="bookmarks-title"><header class="personal-hero"><p class="route-eyebrow">Personal</p><div><h1 id="bookmarks-title">Bookmarks</h1><p>References you have deliberately kept close in this development preview.</p></div></header>${items.length ? `<div class="personal-list">${items.map((item)=>personalListItemMarkup(item)).join('')}</div>` : `<div class="personal-empty"><strong>Nothing saved yet.</strong><p>Use Save on an article, Playbook or Academia lesson and it will appear here.</p><a href="#/library" data-route-link>Browse the Library →</a></div>`}</section>`;
}
function historyTemplate() {
  const items=getReadingHistory();
  return `<section class="personal-view" aria-labelledby="history-title"><header class="personal-hero"><p class="route-eyebrow">Personal</p><div><h1 id="history-title">Reading history</h1><p>Your most recently opened references, Playbooks and lessons. This state remains local to the preview.</p></div></header>${items.length ? `<div class="personal-list">${items.map((item)=>personalListItemMarkup(item,{history:true})).join('')}</div>` : `<div class="personal-empty"><strong>No reading history yet.</strong><p>Open a reference, Playbook or lesson and Atlas will keep a private local trail here.</p></div>`}</section>`;
}
function continueReadingTemplate() {
  const history=getReadingHistory();
  const academia=readAcademiaProgress();
  const items=history.map((item)=>{
    if(item.type==='article') { const progress=getReadingProgress(item.slug); return progress<1 ? {item,progress} : null; }
    if(item.type==='academia-lesson' && !academia.completed.includes(item.slug)) return {item,progress:null};
    return null;
  }).filter(Boolean);
  return `<section class="personal-view" aria-labelledby="continue-title"><header class="personal-hero"><p class="route-eyebrow">Personal</p><div><h1 id="continue-title">Continue reading</h1><p>Return to unfinished long-form references and lessons without adding noise to the Home page.</p></div></header>${items.length ? `<div class="personal-list">${items.map(({item,progress})=>personalListItemMarkup(item,{progress})).join('')}</div>` : `<div class="personal-empty"><strong>Nothing waiting for you.</strong><p>Partially read articles and opened, incomplete lessons will appear here.</p></div>`}</section>`;
}
const UPDATE_ACK_STORAGE='update-acknowledgements.v1';
function readUpdateAcknowledgements(){ return getAcknowledgements(); }
function updateTypeLabel(item){ return item.updateType==='required'?'Required reading':item.updateType==='important'?'Important':item.updateType==='archived'?'Archived':'Informational'; }
function updateTargetRoute(item){ if(!item.target?.slug) return null; return item.target.type==='playbook'?`/playbook/${item.target.slug}`:item.target.type==='academia-lesson'?`/academia/${item.target.slug}`:`/article/${item.target.slug}`; }
async function updatesTemplate(filter='all',focus=''){
  const updates=await getUpdates(); const acknowledgements=readUpdateAcknowledgements();
  const canNotifySlack=['founder','partner'].includes(getAuthenticationSnapshot().user?.role||'');
  const filtered=filter==='all'?updates:updates.filter((item)=>item.updateType===filter);
  const filters=[['all','All'],['important','Important'],['required','Required'],['archived','Archived']];
  return `<section class="updates-view" data-updates-view aria-labelledby="updates-title"><header class="updates-hero"><p class="route-eyebrow">Updates</p><div><h1 id="updates-title">What changed, and why.</h1><p>New and revised knowledge, important changes and required reading—presented without alarm fatigue.</p></div></header><div class="updates-filter" role="group" aria-label="Filter updates">${filters.map(([value,label])=>`<button type="button" data-update-filter="${value}" aria-pressed="${filter===value}">${label}</button>`).join('')}</div><aside class="updates-demo-notice"><strong>Demonstration knowledge</strong><span>These records are RLS-protected production data, but their policy content still requires MOSCATELLI editorial approval.</span></aside><div class="updates-list">${filtered.map((item)=>{const ack=acknowledgements.includes(item.slug);const target=updateTargetRoute(item);const slackKind=item.updateType==='required'?'required':item.updateType==='important'?'important':'';return `<article class="update-item update-item--${escapeHTML(item.updateType)}" data-update-item="${escapeHTML(item.slug)}"${item.slug===focus?' data-focus="true"':''}><div class="update-item__rail"><span>${escapeHTML(updateTypeLabel(item))}</span><time datetime="${escapeHTML(item.effectiveDate)}">${escapeHTML(formatArticleDate(item.effectiveDate))}</time></div><div class="update-item__body"><p>${escapeHTML(item.eyebrow)}</p><h2>${escapeHTML(item.title)}</h2><p>${escapeHTML(item.summary)}</p><div class="update-change"><strong>What changed</strong><span>${escapeHTML(item.changeSummary)}</span></div><div class="update-item__meta"><span>v${escapeHTML(item.version)}</span><span>${escapeHTML(item.owner)}</span><span>${escapeHTML((item.audience||[]).join(', '))}</span></div><div class="update-item__actions">${target?`<a href="#${escapeHTML(target)}" data-route-link>${escapeHTML(item.target.label||'Open related reference')} <span aria-hidden="true">↗</span></a>`:''}${item.acknowledgementRequired?`<button type="button" data-update-ack="${escapeHTML(item.slug)}" aria-pressed="${ack}">${ack?'Acknowledged':'Acknowledge reading'}</button>`:''}${canNotifySlack&&slackKind?`<button type="button" data-slack-notify="${escapeHTML(item.id)}" data-slack-kind="${slackKind}">Notify Slack</button>`:''}</div></div></article>`}).join('') || `<div class="personal-empty"><strong>No updates in this view.</strong><p>Choose another update filter.</p></div>`}</div></section>`;
}
async function recordHistoryFromRoute(route){
  try {
    let record=null;
    if(route?.name==='article'){const item=await getArticleMetadata(route.segments[0]);if(item)record={type:'article',slug:item.slug,title:item.title,summary:item.summary,route:`/article/${item.slug}`,context:`Library · ${item.topic||'Reference'}`};}
    else if(route?.name==='playbook'){const item=await getPlaybookMetadata(route.segments[0]);if(item)record={type:'playbook',slug:item.slug,title:item.title,summary:item.summary,route:`/playbook/${item.slug}`,context:`Playbook · ${item.topic||'Situation'}`};}
    else if(route?.name==='academia-path'){const item=await getAcademiaLessonMetadata(route.segments[0]);if(item)record={type:'academia-lesson',slug:item.slug,title:item.title,summary:item.summary,route:`/academia/${item.slug}`,context:'Academia · Lesson'};}
    if(record) recordReadingHistory(record);
  } catch(error){ console.warn('[Atlas] Reading history could not be recorded:',error); }
}

function libraryLoadingTemplate() {
  return `
    <section class="library-view" aria-labelledby="library-title" aria-busy="true">
      <header class="library-hero">
        <p class="route-eyebrow">Library</p>
        <h1 id="library-title">Browse Atlas.</h1>
        <p>Preparing the local knowledge index…</p>
      </header>
    </section>`;
}

function libraryErrorTemplate() {
  const offline = navigator.onLine === false;
  return `
    <section class="library-view" aria-labelledby="library-title">
      <header class="library-hero">
        <p class="route-eyebrow">Library</p>
        <h1 id="library-title">${offline ? 'This knowledge is unavailable offline.' : 'The Library could not be loaded.'}</h1>
        <p>${offline ? 'Atlas keeps its application shell available offline, but internal knowledge is deliberately not cached on this device by default. Reconnect to load the current source.' : 'The development content index is unavailable. Use the standalone preview or serve the modular project over HTTP rather than opening it directly from the file system.'}</p>
      </header>
      <a class="route-back" href="#/home" data-route-link>← Return home</a>
    </section>`;
}

function libraryCategoryStrip(categories, activeSlug) {
  const allCurrent = !activeSlug ? ' aria-current="page"' : '';
  const links = categories.map((category) => {
    const current = category.slug === activeSlug ? ' aria-current="page"' : '';
    return `<a class="library-category-pill" href="#/library/${escapeHTML(category.slug)}" data-route-link${current}>${escapeHTML(category.shortName || category.name)}</a>`;
  }).join('');
  return `<nav class="library-category-strip" aria-label="Library subjects"><a class="library-category-pill" href="#/library" data-route-link${allCurrent}>All</a>${links}</nav>`;
}

function libraryItemMarkup(item, categoriesBySlug) {
  const category = categoriesBySlug.get(item.category);
  const status = item.status === 'under-review' ? '<span class="library-status">Under review</span>' : '';
  return `
    <a class="library-item" href="#/article/${escapeHTML(item.slug)}" data-route-link data-library-item data-library-text="${escapeHTML([item.title, item.summary, item.topic, ...(item.keywords || [])].join(' ').toLocaleLowerCase())}">
      <span class="library-item__context">${escapeHTML(category?.name || item.category)} · ${escapeHTML(item.topic || 'Reference')}</span>
      <span class="library-item__title">${escapeHTML(item.title)}</span>
      <span class="library-item__summary">${escapeHTML(item.summary)}</span>
      <span class="library-item__meta"><span>${escapeHTML(String(item.readingMinutes))} min</span><span>v${escapeHTML(item.version)}</span>${status}<span class="library-demo-label">Demo</span></span>
      <span class="library-item__arrow" aria-hidden="true">↗</span>
    </a>`;
}

async function libraryTemplate(activeSlug = null) {
  const [index, categories] = await Promise.all([loadContentIndex(), getCategories()]);
  const activeCategory = activeSlug ? await getCategory(activeSlug) : null;
  if (activeSlug && !activeCategory) {
    return placeholderTemplate({ eyebrow: 'Library', title: 'Subject not found.', summary: 'This Library category is not part of the current Atlas taxonomy.', note: 'Choose one of the eight subjects from Browse or return to the complete Library.' });
  }

  const items = await getLibraryItems({ category: activeSlug });
  const categoriesBySlug = new Map(categories.map((category) => [category.slug, category]));
  const topicMarkup = activeCategory
    ? `<div class="library-subject-card"><p class="library-subject-card__label">Within this subject</p><ul>${activeCategory.topics.map((topic) => `<li>${escapeHTML(topic)}</li>`).join('')}</ul>${activeCategory.permissionHint ? `<p class="library-permission-note">${escapeHTML(activeCategory.permissionHint)}</p>` : ''}</div>`
    : `<div class="library-subject-card"><p class="library-subject-card__label">Manual research</p><p>Use the subject strip or the Browse menu to narrow the institutional reference by area.</p><dl><div><dt>${categories.length}</dt><dd>subjects</dd></div><div><dt>${index.items.length}</dt><dd>demo references</dd></div></dl></div>`;

  const heading = activeCategory?.name || 'Browse Atlas.';
  const summary = activeCategory?.description || 'Knowledge organised for deliberate manual research — by subject, standard and procedure.';

  return `
    <section class="library-view" data-library-view data-active-category="${escapeHTML(activeSlug || 'all')}" aria-labelledby="library-title">
      <header class="library-hero">
        <p class="route-eyebrow">Library</p>
        <div class="library-hero__copy">
          <h1 id="library-title">${escapeHTML(heading)}</h1>
          <p>${escapeHTML(summary)}</p>
        </div>
      </header>

      <div class="library-toolbar">
        <div class="library-category-scroller">${libraryCategoryStrip(categories, activeSlug)}</div>
        <label class="library-filter">
          <span class="sr-only">Filter the current Library view</span>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="m21 21-4.35-4.35m1.35-5.15A6.5 6.5 0 1 1 5 11.5a6.5 6.5 0 0 1 13 0Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
          <input type="search" data-library-filter autocomplete="off" placeholder="${escapeHTML(t('Filter this view'))}">
        </label>
      </div>

      <p class="library-demo-notice"><strong>Development preview.</strong> These entries are demonstration content used to validate Atlas and are not final MOSCATELLI policy.</p>

      <div class="library-body">
        <aside class="library-subject" aria-label="Subject information">${topicMarkup}</aside>
        <div class="library-results">
          <div class="library-results__head">
            <p><span data-library-count>${items.length}</span> <span data-library-count-noun>${t(items.length === 1 ? 'reference' : 'references')}</span></p>
            <span>${activeCategory ? escapeHTML(activeCategory.name) : t('All subjects')}</span>
          </div>
          <div class="library-list" data-library-list>
            ${items.map((item) => libraryItemMarkup(item, categoriesBySlug)).join('')}
          </div>
          <div class="library-empty" data-library-empty hidden>
            <p>No references match this filter.</p>
            <span>Try a broader word or clear the field.</span>
          </div>
        </div>
      </div>
    </section>`;
}

function formatArticleDate(value) {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function sectionId(heading, index) {
  const base = String(heading || `Section ${index + 1}`)
    .toLocaleLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 54);
  return `article-section-${base || index + 1}-${index + 1}`;
}

function articleBlockMarkup(block = {}) {
  switch (block.type) {
    case 'callout':
      return `<aside class="article-callout"><p class="article-callout__label">${escapeHTML(block.label || 'Note')}</p><p>${escapeHTML(block.text || '')}</p></aside>`;
    case 'checklist':
      return `<ul class="article-checklist" aria-label="Checklist">${(block.items || []).map((item) => `<li><span class="article-checklist__mark" aria-hidden="true"></span><span>${escapeHTML(item)}</span></li>`).join('')}</ul>`;
    case 'procedure':
      return `<ol class="article-procedure">${(block.steps || []).map((step, index) => `<li><span class="article-procedure__number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span><div><strong>${escapeHTML(step.title || `Step ${index + 1}`)}</strong><p>${escapeHTML(step.text || '')}</p></div></li>`).join('')}</ol>`;
    case 'list':
      return `<ul class="article-list">${(block.items || []).map((item) => `<li>${escapeHTML(item)}</li>`).join('')}</ul>`;
    case 'quote':
      return `<blockquote class="article-quote">${escapeHTML(block.text || '')}</blockquote>`;
    case 'paragraph':
    default:
      return `<p>${escapeHTML(block.text || '')}</p>`;
  }
}

function governanceMarkup(article) {
  const statusLabel = String(article.status || 'current').replaceAll('-', ' ');
  const audience = Array.isArray(article.audience) ? article.audience.join(', ') : article.audience || '—';
  return `
    <section class="article-governance" aria-labelledby="article-governance-title">
      <div class="article-section-kicker">Governance</div>
      <h2 id="article-governance-title">Reference record</h2>
      <dl class="article-governance__grid">
        <div><dt>Owner</dt><dd>${escapeHTML(article.owner || '—')}</dd></div>
        <div><dt>Approved by</dt><dd>${escapeHTML(article.approver || '—')}</dd></div>
        <div><dt>Version</dt><dd>${escapeHTML(article.version || '—')}</dd></div>
        <div><dt>Status</dt><dd class="article-status article-status--${escapeHTML(article.status || 'current')}">${escapeHTML(statusLabel)}</dd></div>
        <div><dt>Published</dt><dd>${escapeHTML(formatArticleDate(article.publishedDate))}</dd></div>
        <div><dt>Last reviewed</dt><dd>${escapeHTML(formatArticleDate(article.lastReviewed))}</dd></div>
        <div><dt>Next review</dt><dd>${escapeHTML(formatArticleDate(article.nextReview))}</dd></div>
        <div><dt>Language</dt><dd>${escapeHTML(article.languageStatus || '—')}</dd></div>
        <div class="article-governance__wide"><dt>Audience</dt><dd>${escapeHTML(audience)}</dd></div>
      </dl>
    </section>`;
}

function relatedMarkup(relatedItems) {
  if (!relatedItems.length) return '';
  return `
    <section class="article-related" aria-labelledby="article-related-title">
      <div class="article-section-kicker">Continue</div>
      <h2 id="article-related-title">Related references</h2>
      <div class="article-related__list">
        ${relatedItems.map((item) => `<a href="#/article/${escapeHTML(item.slug)}" data-route-link><span>${escapeHTML(item.eyebrow || item.topic || 'Reference')}</span><strong>${escapeHTML(item.title)}</strong><i aria-hidden="true">↗</i></a>`).join('')}
      </div>
    </section>`;
}

async function articleTemplate(slug) {
  const item = await getArticleMetadata(slug);
  if (!item) return placeholderTemplate({ eyebrow: 'Article', title: 'Reference not found.', summary: 'This article slug is not present in the current local content index.', note: 'The Library contains the demonstration references currently available.' });

  const [article, categories, allItems] = await Promise.all([
    loadArticle(slug),
    getCategories(),
    getLibraryItems(),
  ]);
  if (!article) return placeholderTemplate({ eyebrow: 'Article', title: 'Reference unavailable.', summary: 'The indexed reference could not be loaded from the local development content source.', note: 'Check the content document for this slug.' });

  const category = categories.find((entry) => entry.slug === article.category);
  const sections = Array.isArray(article.sections) ? article.sections : [];
  const sectionRecords = sections.map((section, index) => ({ ...section, id: sectionId(section.heading, index) }));
  const storedProgress = getReadingProgress(slug);
  const relatedSlugs = Array.isArray(article.related) ? article.related : [];
  const relatedItems = relatedSlugs.map((relatedSlug) => allItems.find((entry) => entry.slug === relatedSlug)).filter(Boolean);
  const toc = sectionRecords.map((section, index) => `<button type="button" class="article-toc__link" data-article-toc-target="${section.id}" data-article-toc-index="${index}">${escapeHTML(section.heading)}</button>`).join('');

  return `
    <article class="article-view" data-article-root data-article-slug="${escapeHTML(slug)}" data-article-saved-progress="${Math.round(storedProgress * 100)}" aria-labelledby="article-title">
      <div class="article-progress" role="progressbar" aria-label="Article reading progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(storedProgress * 100)}" data-article-progress>
        <span style="--article-progress-ratio:${storedProgress.toFixed(4)}" data-article-progress-bar></span>
      </div>

      <header class="article-hero">
        <div class="article-hero__back">
          <a href="#/library/${escapeHTML(article.category)}" data-route-link>← ${escapeHTML(category?.name || 'Library')}</a>
        </div>
        <div class="article-hero__copy">
          <p class="route-eyebrow">${escapeHTML(article.eyebrow || item.eyebrow || 'Article')}</p>
          <h1 id="article-title">${escapeHTML(article.title)}</h1>
          <p class="article-hero__summary">${escapeHTML(article.summary)}</p>
          <div class="article-hero__meta" aria-label="Article metadata">
            <span>${escapeHTML(String(article.readingMinutes || item.readingMinutes || '—'))} min read</span>
            <span>${escapeHTML(article.topic || item.topic || 'Reference')}</span>
            <span>v${escapeHTML(article.version || item.version || '—')}</span>
          </div>
          <div class="atlas-reading-actions">${bookmarkButtonMarkup({type:'article',slug:article.slug,title:article.title,summary:article.summary,route:`/article/${article.slug}`,context:`Library · ${article.topic || 'Reference'}`})}</div>
        </div>
      </header>

      <div class="article-layout">
        <aside class="article-rail" aria-label="Article navigation">
          ${article.tableOfContents && sectionRecords.length > 1 ? `<nav class="article-toc" aria-label="On this page"><p>On this page</p>${toc}</nav>` : ''}
          <div class="article-progress-readout">
            <span data-article-progress-label>${Math.round(storedProgress * 100)}%</span>
            <small>read</small>
          </div>
        </aside>

        <div class="article-reading" data-article-reading>
          ${article.demo ? `<aside class="article-demo-notice"><strong>Demonstration reference</strong><span>${escapeHTML(article.contentNotice || 'This content exists to validate the Atlas interface and is not final company policy.')}</span></aside>` : ''}

          ${article.tableOfContents && sectionRecords.length > 1 ? `<details class="article-toc-mobile"><summary>On this page <span aria-hidden="true">+</span></summary><nav aria-label="On this page">${toc}</nav></details>` : ''}

          <div class="article-content">
            ${sectionRecords.map((section) => `<section id="${section.id}" class="article-section" data-article-section><h2>${escapeHTML(section.heading)}</h2>${(section.blocks || []).map(articleBlockMarkup).join('')}</section>`).join('')}
          </div>

          ${relatedMarkup(relatedItems)}
          ${governanceMarkup(article)}

          <footer class="article-end">
            <p>End of reference</p>
            <a href="#/library/${escapeHTML(article.category)}" data-route-link>Return to ${escapeHTML(category?.name || 'Library')} →</a>
          </footer>
        </div>
      </div>
    </article>`;
}


function playbooksLoadingTemplate() {
  return `
    <section class="playbooks-view" aria-labelledby="playbooks-title" aria-busy="true">
      <header class="playbooks-hero"><p class="route-eyebrow">Playbooks</p><h1 id="playbooks-title">Preparing situational guidance…</h1></header>
    </section>`;
}

function playbookListItemMarkup(item, categoriesBySlug) {
  const category = categoriesBySlug.get(item.category);
  const firstMove = item.firstMove || item.summary;
  return `
    <a class="playbook-list-item" href="#/playbook/${escapeHTML(item.slug)}" data-route-link data-playbook-list-item data-playbook-text="${escapeHTML([item.title, item.summary, item.topic, ...(item.keywords || [])].join(' ').toLocaleLowerCase())}">
      <span class="playbook-list-item__context">${escapeHTML(category?.name || item.category)} · ${escapeHTML(item.topic || 'Situation')}</span>
      <strong class="playbook-list-item__title">${escapeHTML(item.title)}</strong>
      <span class="playbook-list-item__summary">${escapeHTML(item.summary)}</span>
      <span class="playbook-list-item__meta"><span>${escapeHTML(String(item.readingMinutes || 4))} min</span><span>v${escapeHTML(item.version || '—')}</span><span>Demo</span></span>
      <i aria-hidden="true">↗</i>
    </a>`;
}

async function playbooksTemplate() {
  const [items, categories] = await Promise.all([getPlaybookItems(), getCategories()]);
  const categoriesBySlug = new Map(categories.map((category) => [category.slug, category]));
  return `
    <section class="playbooks-view" data-playbooks-view aria-labelledby="playbooks-title">
      <header class="playbooks-hero">
        <p class="route-eyebrow">Playbooks</p>
        <div>
          <h1 id="playbooks-title">When something changes, start here.</h1>
          <p>Scenario-based guidance designed to make the first useful action obvious, then preserve a clear escalation and record trail.</p>
        </div>
      </header>

      <div class="playbooks-utility">
        <label class="playbooks-filter">
          <span class="sr-only">Filter playbooks</span>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="m21 21-4.35-4.35m1.35-5.15A6.5 6.5 0 1 1 5 11.5a6.5 6.5 0 0 1 13 0Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
          <input type="search" autocomplete="off" placeholder="Find a situation" data-playbooks-filter>
        </label>
        <p class="playbooks-count"><strong data-playbooks-count>${items.length}</strong> <span data-playbooks-count-noun>${items.length === 1 ? 'playbook' : 'playbooks'}</span></p>
      </div>

      <aside class="playbooks-demo-notice"><strong>Demonstration guidance</strong><span>These scenarios validate the Atlas experience. They are not final company policy.</span></aside>

      <div class="playbooks-list" data-playbooks-list>
        ${items.map((item) => playbookListItemMarkup(item, categoriesBySlug)).join('')}
      </div>
      <div class="playbooks-empty" data-playbooks-empty hidden><strong>No matching situation.</strong><span>Try a broader word or use global Search.</span></div>
    </section>`;
}

function playbookGovernanceMarkup(playbook) {
  const statusLabel = String(playbook.status || 'current').replaceAll('-', ' ');
  const audience = Array.isArray(playbook.audience) ? playbook.audience.join(', ') : playbook.audience || '—';
  return `
    <section class="playbook-governance" aria-labelledby="playbook-governance-title">
      <p class="playbook-section-label">Governance</p>
      <h2 id="playbook-governance-title">Playbook record</h2>
      <dl>
        <div><dt>Owner</dt><dd>${escapeHTML(playbook.owner || '—')}</dd></div>
        <div><dt>Approved by</dt><dd>${escapeHTML(playbook.approver || '—')}</dd></div>
        <div><dt>Version</dt><dd>${escapeHTML(playbook.version || '—')}</dd></div>
        <div><dt>Status</dt><dd>${escapeHTML(statusLabel)}</dd></div>
        <div><dt>Last reviewed</dt><dd>${escapeHTML(formatArticleDate(playbook.lastReviewed))}</dd></div>
        <div><dt>Next review</dt><dd>${escapeHTML(formatArticleDate(playbook.nextReview))}</dd></div>
        <div class="playbook-governance__wide"><dt>Audience</dt><dd>${escapeHTML(audience)}</dd></div>
      </dl>
    </section>`;
}

function playbookResourceMarkup(resource = {}) {
  if (resource.route) {
    return `<a class="playbook-resource" href="${escapeHTML(resource.route)}" data-route-link><span>${escapeHTML(resource.kind || 'Reference')}</span><strong>${escapeHTML(resource.label || 'Open reference')}</strong><i aria-hidden="true">↗</i></a>`;
  }
  return `<div class="playbook-resource playbook-resource--static"><span>${escapeHTML(resource.kind || 'Resource')}</span><strong>${escapeHTML(resource.label || 'Resource')}</strong><p>${escapeHTML(resource.text || '')}</p></div>`;
}

async function playbookTemplate(slug) {
  const meta = await getPlaybookMetadata(slug);
  if (!meta) return placeholderTemplate({ eyebrow: 'Playbook', title: 'Playbook not found.', summary: 'This scenario is not present in the current local content index.', note: 'Return to Playbooks to view the demonstration scenarios currently available.' });

  const [playbook, categories, articleItems] = await Promise.all([loadPlaybook(slug), getCategories(), getLibraryItems()]);
  const category = categories.find((entry) => entry.slug === playbook.category);
  const related = (playbook.relatedProcedures || []).map((relatedSlug) => articleItems.find((item) => item.slug === relatedSlug)).filter(Boolean);
  const immediate = Array.isArray(playbook.immediateAction) ? playbook.immediateAction : [];
  const inform = Array.isArray(playbook.whoToInform) ? playbook.whoToInform : [];
  const record = Array.isArray(playbook.whatToRecord) ? playbook.whatToRecord : [];
  const escalate = Array.isArray(playbook.escalationConditions) ? playbook.escalationConditions : [];
  const resources = Array.isArray(playbook.templatesResources) ? playbook.templatesResources : [];

  return `
    <article class="playbook-view" data-playbook-root aria-labelledby="playbook-title">
      <header class="playbook-hero">
        <a class="playbook-back" href="#/playbooks" data-route-link>← Playbooks</a>
        <div class="playbook-hero__copy">
          <p class="route-eyebrow">${escapeHTML(playbook.eyebrow || 'Operational playbook')} · ${escapeHTML(category?.name || playbook.category)}</p>
          <h1 id="playbook-title">${escapeHTML(playbook.title)}</h1>
          <p>${escapeHTML(playbook.summary)}</p>
          <div class="playbook-hero__meta"><span>${escapeHTML(String(playbook.readingMinutes || 4))} min</span><span>${escapeHTML(playbook.topic || 'Situation')}</span><span>v${escapeHTML(playbook.version || '—')}</span></div>
          <div class="atlas-reading-actions">${bookmarkButtonMarkup({type:'playbook',slug:playbook.slug,title:playbook.title,summary:playbook.summary,route:`/playbook/${playbook.slug}`,context:`Playbook · ${playbook.topic || 'Situation'}`})}</div>
        </div>
      </header>

      <div class="playbook-frame">
        <aside class="playbook-scenario">
          <p class="playbook-section-label">Scenario</p>
          <p>${escapeHTML(playbook.scenario || '')}</p>
          ${playbook.demo ? `<div class="playbook-demo-mark"><strong>Demo</strong><span>${escapeHTML(playbook.contentNotice || '')}</span></div>` : ''}
        </aside>

        <div class="playbook-main">
          <section class="playbook-immediate" aria-labelledby="playbook-immediate-title">
            <p class="playbook-section-label">Immediate action</p>
            <h2 id="playbook-immediate-title">Start with these actions.</h2>
            <ol>${immediate.map((item, index) => `<li><span>${String(index + 1).padStart(2, '0')}</span><p>${escapeHTML(item)}</p></li>`).join('')}</ol>
          </section>

          <div class="playbook-response-grid">
            <section class="playbook-response-section" aria-labelledby="playbook-inform-title">
              <p class="playbook-section-label">Who to inform</p><h2 id="playbook-inform-title">Keep the right people close.</h2>
              <ul class="playbook-role-list">${inform.map((entry) => `<li><strong>${escapeHTML(entry.role || '')}</strong><span>${escapeHTML(entry.when || '')}</span></li>`).join('')}</ul>
            </section>
            <section class="playbook-response-section" aria-labelledby="playbook-record-title">
              <p class="playbook-section-label">What to record</p><h2 id="playbook-record-title">Preserve the decision trail.</h2>
              <ul class="playbook-tick-list">${record.map((item) => `<li>${escapeHTML(item)}</li>`).join('')}</ul>
            </section>
          </div>

          <section class="playbook-escalation" aria-labelledby="playbook-escalation-title">
            <p class="playbook-section-label">Escalate when</p>
            <h2 id="playbook-escalation-title">Move beyond the standard path when any of these become true.</h2>
            <ul>${escalate.map((item) => `<li>${escapeHTML(item)}</li>`).join('')}</ul>
          </section>

          <section class="playbook-resources" aria-labelledby="playbook-resources-title">
            <p class="playbook-section-label">Templates & resources</p><h2 id="playbook-resources-title">Use the record, not memory.</h2>
            <div>${resources.map(playbookResourceMarkup).join('')}</div>
          </section>

          ${related.length ? `<section class="playbook-related" aria-labelledby="playbook-related-title"><p class="playbook-section-label">Related procedures</p><h2 id="playbook-related-title">Read alongside this playbook.</h2><div>${related.map((item) => `<a href="#/article/${escapeHTML(item.slug)}" data-route-link><span>${escapeHTML(item.topic || 'Reference')}</span><strong>${escapeHTML(item.title)}</strong><i aria-hidden="true">↗</i></a>`).join('')}</div></section>` : ''}

          ${playbookGovernanceMarkup(playbook)}
          <footer class="playbook-end"><span>End of playbook</span><a href="#/playbooks" data-route-link>Return to Playbooks →</a></footer>
        </div>
      </div>
    </article>`;
}


function escapeRegExp(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightSearchText(value, terms = []) {
  const source = String(value || '');
  const usable = [...new Set(terms.map((term) => String(term || '').trim()).filter((term) => term.length > 1))]
    .sort((a, b) => b.length - a.length);
  if (!usable.length) return escapeHTML(source);
  const pattern = new RegExp(`(${usable.map(escapeRegExp).join('|')})`, 'gi');
  return source.split(pattern).map((part, index) => index % 2 ? `<mark>${escapeHTML(part)}</mark>` : escapeHTML(part)).join('');
}

function searchResultMarkup(result, terms, { compact = false } = {}) {
  const status = result.status === 'under-review' ? '<span>Under review</span>' : '';
  const excerpt = result.excerpt && result.excerpt !== result.summary
    ? `<p class="search-result__excerpt">${highlightSearchText(result.excerpt, terms)}</p>`
    : '';
  return `
    <article class="search-result${compact ? ' search-result--compact' : ''}${excerpt ? ' search-result--has-excerpt' : ''}" role="listitem">
      <a class="search-result__link" href="#${escapeHTML(result.route || `/article/${result.slug}`)}" data-route-link data-search-result-link>
        <span class="search-result__context">${escapeHTML(result.typeLabel || 'Reference')} · ${escapeHTML(result.categoryName)} · ${escapeHTML(result.topic || 'Reference')}</span>
        <strong class="search-result__title">${highlightSearchText(result.title, terms)}</strong>
        <p class="search-result__summary">${highlightSearchText(result.summary, terms)}</p>
        ${compact ? '' : excerpt}
        <span class="search-result__meta"><span>${escapeHTML(String(result.readingMinutes))} min</span><span>v${escapeHTML(result.version)}</span>${status}${result.demo ? '<span>Demo</span>' : ''}</span>
        <i class="search-result__arrow" aria-hidden="true">↗</i>
      </a>
    </article>`;
}

function searchStarterMarkup(query, label = query) {
  return `<a class="search-starter" href="#/search?q=${encodeURIComponent(query)}" data-route-link><span>${escapeHTML(label)}</span><i aria-hidden="true">↗</i></a>`;
}

function searchLoadingTemplate() {
  return `
    <section class="search-page" aria-labelledby="search-page-title" aria-busy="true">
      <header class="search-page__header">
        <p class="route-eyebrow">Search</p>
        <h1 id="search-page-title">Search Atlas</h1>
        <p>Preparing the local knowledge index…</p>
      </header>
    </section>`;
}

async function searchTemplate(query = '', category = null) {
  const categories = await getCategories();
  const activeCategory = category && categories.some((item) => item.slug === category) ? category : null;
  const resultSet = query ? await searchAtlas(query, { category: activeCategory }) : { total: 0, results: [], terms: { expanded: [] } };
  const recent = readRecentSearches();
  const categoryOptions = categories.map((item) => `<option value="${escapeHTML(item.slug)}"${item.slug === activeCategory ? ' selected' : ''}>${escapeHTML(item.name)}</option>`).join('');
  const queryValue = escapeHTML(query);

  let body = '';
  if (!query) {
    const recentMarkup = recent.length
      ? `<section class="search-start-group"><h2>Recent</h2><div>${recent.map((item) => searchStarterMarkup(item)).join('')}</div></section>`
      : '';
    body = `
      <div class="search-empty-start">
        ${recentMarkup}
        <section class="search-start-group"><h2>Try searching</h2><div>${HOME_SEARCH_SUGGESTIONS.map((item) => searchStarterMarkup(item.query, item.label)).join('')}</div></section>
        <p class="search-synonym-note">Atlas understands common equivalents such as supplier/vendor, bill/invoice, cost/expense and sample/prototype.</p>
      </div>`;
  } else if (!resultSet.results.length) {
    body = `
      <div class="search-no-results" role="status">
        <h2>No matching reference found.</h2>
        <p>Try a broader term, a related word, or browse the Library manually by subject.</p>
        <a href="#/library" data-route-link>Browse the Library →</a>
      </div>`;
  } else {
    body = `<div class="search-results" role="list" aria-label="Search results">${resultSet.results.map((result) => searchResultMarkup(result, resultSet.terms.expanded)).join('')}</div>`;
  }

  const resultMessage = !query
    ? 'Search titles, summaries, keywords and full Atlas content.'
    : `${resultSet.total} ${resultSet.total === 1 ? 'result' : 'results'}${activeCategory ? ' in this subject' : ''} for “${query}”`;

  return `
    <section class="search-page" data-search-page aria-labelledby="search-page-title">
      <header class="search-page__header">
        <p class="route-eyebrow">Search</p>
        <div class="search-page__heading">
          <h1 id="search-page-title">Search Atlas</h1>
          <p>Search across the current institutional reference, not merely article titles.</p>
        </div>
      </header>

      <div class="search-page__utility">
        <form class="search-route-form" data-search-route-form role="search" novalidate>
          <label class="sr-only" for="atlas-search-page-input">Search Atlas</label>
          <span class="search-route-form__icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="21" height="21"><path d="m21 21-4.35-4.35m1.35-5.15A6.5 6.5 0 1 1 5 11.5a6.5 6.5 0 0 1 13 0Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg></span>
          <input id="atlas-search-page-input" data-search-route-input name="q" type="search" autocomplete="off" spellcheck="false" value="${queryValue}" placeholder="What are you looking for?">
          <button type="submit" aria-label="Run search"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M5 12h13m-5-5 5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        </form>

        <div class="search-result-toolbar">
          <p data-search-result-count aria-live="polite">${escapeHTML(resultMessage)}</p>
          <label class="search-subject-filter"><span>Subject</span><select data-search-subject-filter><option value="">All subjects</option>${categoryOptions}</select></label>
        </div>
      </div>

      ${body}
    </section>`;
}


const ACADEMIA_PROGRESS_STORAGE = 'academia-progress.v1';

function readAcademiaProgress() {
  const value = readDemoJSON(ACADEMIA_PROGRESS_STORAGE, { completed: [], acknowledged: [] });
  return {
    completed: Array.isArray(value?.completed) ? value.completed : [],
    acknowledged: Array.isArray(value?.acknowledged) ? value.acknowledged : [],
  };
}

function writeAcademiaProgress(progress) {
  return writeDemoJSON(ACADEMIA_PROGRESS_STORAGE, {
    completed: [...new Set(progress.completed || [])],
    acknowledged: [...new Set(progress.acknowledged || [])],
  });
}

function courseLessonSlugs(course) {
  return (course.modules || []).flatMap((module) => module.lessons || []);
}

async function courseProgress(course) {
  const progress = readAcademiaProgress();
  const lessonSlugs = courseLessonSlugs(course);
  const lessonMeta = await Promise.all(lessonSlugs.map((slug) => getAcademiaLessonMetadata(slug)));
  const required = lessonMeta.filter((item) => item?.requirement !== 'optional');
  const completedRequired = required.filter((item) => progress.completed.includes(item.slug));
  const percent = required.length ? Math.round((completedRequired.length / required.length) * 100) : 0;
  const firstIncomplete = lessonMeta.find((item) => item && !progress.completed.includes(item.slug));
  return { percent, requiredCount: required.length, completedRequired: completedRequired.length, firstIncomplete, lessonMeta };
}

function academiaLoadingTemplate() {
  return `<section class="academia-view" aria-labelledby="academia-title" aria-busy="true"><header class="academia-hero"><p class="route-eyebrow">Academia</p><h1 id="academia-title">Preparing learning paths…</h1></header></section>`;
}

async function academiaTemplate() {
  const courses = await getAcademiaCourses();
  const rows = await Promise.all(courses.map(async (course) => ({ course, progress: await courseProgress(course) })));
  return `
    <section class="academia-view" data-academia-view aria-labelledby="academia-title">
      <header class="academia-hero">
        <p class="route-eyebrow">Academia</p>
        <div>
          <h1 id="academia-title">Learn the House.</h1>
          <p>Structured internal learning without noise, competition or gamification. Progress is private in this development preview.</p>
        </div>
      </header>
      <div class="academia-notice"><strong>Demonstration curriculum</strong><span>Learning content shown here exists to validate Atlas. It is not final MOSCATELLI policy or curriculum.</span></div>
      <div class="academia-course-list" aria-label="Learning paths">
        ${rows.map(({course,progress}) => `
          <article class="academia-course-card">
            <div class="academia-course-card__top"><span>${escapeHTML(course.area)}</span><span>${escapeHTML(String(course.estimatedMinutes))} min</span></div>
            <h2><a href="#/academia/${escapeHTML(course.slug)}" data-route-link>${escapeHTML(course.title)}</a></h2>
            <p>${escapeHTML(course.summary)}</p>
            <div class="academia-progress" aria-label="${escapeHTML(course.title)} required progress: ${progress.percent}%">
              <div class="academia-progress__track"><span style="--academia-progress-ratio:${(progress.percent / 100).toFixed(3)}"></span></div>
              <div class="academia-progress__meta"><span>${progress.completedRequired} of ${progress.requiredCount} required lessons complete</span><strong>${progress.percent}%</strong></div>
            </div>
            <div class="academia-course-card__footer">
              <span>${course.modules.length} ${course.modules.length === 1 ? 'module' : 'modules'}</span>
              <a href="#/academia/${escapeHTML(progress.firstIncomplete?.slug || course.slug)}" data-route-link>${progress.percent > 0 && progress.percent < 100 ? 'Continue' : progress.percent === 100 ? 'Review course' : 'Open course'} <span aria-hidden="true">↗</span></a>
            </div>
          </article>`).join('')}
      </div>
    </section>`;
}

async function academiaCourseTemplate(course) {
  const progress = await courseProgress(course);
  const metaMap = new Map(progress.lessonMeta.filter(Boolean).map((item) => [item.slug, item]));
  const state = readAcademiaProgress();
  return `
    <section class="academia-course-view" aria-labelledby="academia-course-title">
      <header class="academia-course-hero">
        <a class="academia-back" href="#/academia" data-route-link>← Academia</a>
        <div>
          <p class="route-eyebrow">${escapeHTML(course.area)}</p>
          <h1 id="academia-course-title">${escapeHTML(course.title)}</h1>
          <p>${escapeHTML(course.summary)}</p>
          <div class="academia-course-hero__meta"><span>${escapeHTML(String(course.estimatedMinutes))} min</span><span>${progress.requiredCount} required lessons</span><span>v${escapeHTML(course.version)}</span><span>Demo</span></div>
        </div>
      </header>
      <div class="academia-course-progress">
        <div><span>Required progress</span><strong>${progress.percent}%</strong></div>
        <div class="academia-progress__track"><span style="--academia-progress-ratio:${(progress.percent / 100).toFixed(3)}"></span></div>
        <p>${progress.completedRequired} of ${progress.requiredCount} required lessons complete. Optional lessons do not affect course completion.</p>
      </div>
      <div class="academia-module-list">
        ${(course.modules || []).map((module, moduleIndex) => `
          <section class="academia-module" aria-labelledby="module-${escapeHTML(module.id)}">
            <header><span>${String(moduleIndex + 1).padStart(2,'0')}</span><div><h2 id="module-${escapeHTML(module.id)}">${escapeHTML(module.title)}</h2><p>${escapeHTML(module.summary)}</p></div></header>
            <ol>
              ${(module.lessons || []).map((slug) => {
                const item=metaMap.get(slug); if (!item) return '';
                const complete=state.completed.includes(slug);
                return `<li><a href="#/academia/${escapeHTML(slug)}" data-route-link><span class="academia-lesson-state" aria-hidden="true">${complete ? '✓' : ''}</span><span class="academia-lesson-row__copy"><strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(item.summary)}</small></span><span class="academia-lesson-row__meta">${item.requirement === 'optional' ? 'Optional · ' : ''}${escapeHTML(String(item.estimatedMinutes))} min</span><i aria-hidden="true">↗</i></a></li>`;
              }).join('')}
            </ol>
          </section>`).join('')}
      </div>
    </section>`;
}

function academiaLessonBlockMarkup(block = {}) {
  return articleBlockMarkup(block);
}

async function academiaLessonTemplate(lesson) {
  const course=await loadAcademiaCourse(lesson.courseSlug);
  const state=readAcademiaProgress();
  const complete=state.completed.includes(lesson.slug);
  const acknowledged=state.acknowledged.includes(lesson.slug);
  const allSlugs=courseLessonSlugs(course);
  const position=allSlugs.indexOf(lesson.slug);
  const prev=position>0 ? await getAcademiaLessonMetadata(allSlugs[position-1]) : null;
  const next=position>=0 && position<allSlugs.length-1 ? await getAcademiaLessonMetadata(allSlugs[position+1]) : null;
  const sections=(lesson.sections || []).map((section,index)=>`<section class="academia-reading-section" id="academia-lesson-section-${index+1}"><span class="academia-reading-section__number">${String(index+1).padStart(2,'0')}</span><div><h2>${escapeHTML(section.heading)}</h2>${(section.blocks||[]).map(academiaLessonBlockMarkup).join('')}</div></section>`).join('');
  return `
    <section class="academia-lesson-view" data-academia-lesson data-lesson-slug="${escapeHTML(lesson.slug)}" aria-labelledby="academia-lesson-title">
      <header class="academia-lesson-hero">
        <a class="academia-back" href="#/academia/${escapeHTML(course.slug)}" data-route-link>← ${escapeHTML(course.title)}</a>
        <div>
          <p class="route-eyebrow">${escapeHTML(course.area)} · ${lesson.requirement === 'optional' ? 'Optional' : 'Required'}</p>
          <h1 id="academia-lesson-title">${escapeHTML(lesson.title)}</h1>
          <p>${escapeHTML(lesson.summary)}</p>
          <div class="academia-course-hero__meta"><span>${escapeHTML(String(lesson.estimatedMinutes))} min</span><span>Lesson ${position + 1} of ${allSlugs.length}</span><span>v${escapeHTML(lesson.version)}</span></div>
          <div class="atlas-reading-actions">${bookmarkButtonMarkup({type:'academia-lesson',slug:lesson.slug,title:lesson.title,summary:lesson.summary,route:`/academia/${lesson.slug}`,context:'Academia · Lesson'})}</div>
        </div>
      </header>
      <div class="academia-lesson-frame">
        <aside class="academia-lesson-context">
          <p class="academia-context-label">Course</p><a href="#/academia/${escapeHTML(course.slug)}" data-route-link>${escapeHTML(course.title)}</a>
          <p class="academia-context-label">Status</p><strong data-academia-lesson-status>${complete ? 'Completed' : 'Not completed'}</strong>
          <p class="academia-context-note">Progress is stored only in the local development-preview namespace.</p>
        </aside>
        <article class="academia-reading">
          ${sections}
          <aside class="academia-demo-note"><strong>Demonstration learning content</strong><p>${escapeHTML(lesson.contentNotice || '')}</p></aside>
          <section class="academia-completion" aria-labelledby="academia-completion-title">
            <p class="academia-context-label">Learning state</p>
            <h2 id="academia-completion-title">Record your progress.</h2>
            <p>Completion is private demo state and can be changed at any time.</p>
            <div class="academia-completion__actions">
              <button class="academia-action" type="button" data-academia-complete aria-pressed="${complete}">${complete ? 'Completed' : 'Mark lesson complete'}</button>
              ${lesson.acknowledgementRequired ? `<button class="academia-action academia-action--secondary" type="button" data-academia-ack aria-pressed="${acknowledged}">${acknowledged ? 'Acknowledged' : 'Acknowledge reading'}</button>` : ''}
            </div>
            ${lesson.acknowledgementRequired ? `<p class="academia-ack-note" data-academia-ack-note>${acknowledged ? 'Acknowledgement recorded in local demo state.' : 'This demonstration lesson includes an acknowledgement requirement.'}</p>` : ''}
          </section>
          <nav class="academia-lesson-nav" aria-label="Lesson navigation">
            ${prev ? `<a href="#/academia/${escapeHTML(prev.slug)}" data-route-link><span>Previous</span><strong>${escapeHTML(prev.title)}</strong></a>` : '<span></span>'}
            ${next ? `<a href="#/academia/${escapeHTML(next.slug)}" data-route-link><span>Next</span><strong>${escapeHTML(next.title)}</strong></a>` : `<a href="#/academia/${escapeHTML(course.slug)}" data-route-link><span>Course</span><strong>Return to learning path</strong></a>`}
          </nav>
        </article>
      </div>
    </section>`;
}

async function academiaPathTemplate(slug) {
  const resolved=await resolveAcademiaPath(slug);
  if (!resolved) return placeholderTemplate({eyebrow:'Academia',title:'Learning item not found.',summary:'This Academia path is not part of the current demonstration curriculum.',note:'Return to Academia to choose an available learning path.'});
  return resolved.kind === 'course' ? academiaCourseTemplate(resolved.document) : academiaLessonTemplate(resolved.document);
}

function commitRoute(markup, title, serial) {
  if (serial !== renderSerial) return;
  const isInitialRoute = !hasRenderedRoute;

  const update = () => {
    document.title = title;
    outlet.innerHTML = markup;
    if (isInitialRoute) {
      outlet.dataset.initialRoute = 'true';
    } else {
      delete outlet.dataset.initialRoute;
    }
    outlet.removeAttribute('aria-busy');
  };

  const afterUpdate = () => {
    const route = window.__ATLAS_CURRENT_ROUTE__;
    if (route) updateNavigationState(route);
    bindRouteControls(route);
    void recordHistoryFromRoute(route);
    enhanceRouteReveals(outlet);

    window.scrollTo({ top: 0, behavior: 'auto' });
    if (hasRenderedRoute) main?.focus({ preventScroll: true });
    if (routeStatus) {
      routeStatus.textContent = '';
      window.requestAnimationFrame(() => { routeStatus.textContent = route?.name === 'home' ? 'Home' : (title.replace(/ — MOSCATELLI ATLAS$/, '') || 'MOSCATELLI ATLAS'); });
    }
    hasRenderedRoute = true;
    resolveFirstRouteReady?.();
    resolveFirstRouteReady = null;
  };

  if (isInitialRoute) {
    update();
    afterUpdate();
  } else {
    commitRouteWithMotion(update, afterUpdate, outlet);
  }
}

async function renderRoute(route) {
  const serial = ++renderSerial;
  window.__ATLAS_CURRENT_ROUTE__ = route;
  outlet.setAttribute('aria-busy', 'true');
  searchInteractionController?.abort();
  searchInteractionController = null;
  routeInteractionController?.abort();
  routeInteractionController = null;

  let markup = '';
  let title = 'MOSCATELLI ATLAS';

  try {
    switch (route.name) {
      case 'home':
        markup = homeTemplate();
        break;
      case 'library':
        title = 'Library — MOSCATELLI ATLAS';
        markup = await libraryTemplate();
        break;
      case 'library-category': {
        const slug = route.segments[0];
        const name = categoryNames[slug] || slug.replaceAll('-', ' ');
        title = `${name} — Library — MOSCATELLI ATLAS`;
        markup = await libraryTemplate(slug);
        break;
      }
      case 'playbooks':
        title = 'Playbooks — MOSCATELLI ATLAS';
        markup = await playbooksTemplate();
        break;
      case 'academia':
        title = 'Academia — MOSCATELLI ATLAS';
        markup = await academiaTemplate();
        break;
      case 'updates':
        title = 'Updates — MOSCATELLI ATLAS';
        markup = await updatesTemplate(route.params.get('filter') || 'all', route.params.get('focus') || '');
        break;
      case 'bookmarks':
        title = 'Bookmarks — MOSCATELLI ATLAS';
        markup = bookmarksTemplate();
        break;
      case 'continue-reading':
        title = 'Continue reading — MOSCATELLI ATLAS';
        markup = continueReadingTemplate();
        break;
      case 'history':
        title = 'Reading history — MOSCATELLI ATLAS';
        markup = historyTemplate();
        break;
      case 'profile':
        title = 'Profile — MOSCATELLI ATLAS';
        markup = profileTemplate();
        break;
      case 'search': {
        const query = route.params.get('q')?.trim() || '';
        const subject = route.params.get('subject')?.trim() || null;
        title = query ? `${query} — Search — MOSCATELLI ATLAS` : 'Search — MOSCATELLI ATLAS';
        markup = await searchTemplate(query, subject);
        break;
      }
      case 'article':
        const articleItem = await getArticleMetadata(route.segments[0]);
        title = articleItem ? `${articleItem.title} — MOSCATELLI ATLAS` : 'Article — MOSCATELLI ATLAS';
        markup = await articleTemplate(route.segments[0]);
        break;
      case 'playbook': {
        const playbookItem = await getPlaybookMetadata(route.segments[0]);
        title = playbookItem ? `${playbookItem.title} — MOSCATELLI ATLAS` : 'Playbook — MOSCATELLI ATLAS';
        markup = await playbookTemplate(route.segments[0]);
        break;
      }
      case 'academia-path': {
        const academyMeta = await getAcademiaLessonMetadata(route.segments[0]);
        const academyCourses = await getAcademiaCourses();
        const academyCourse = academyCourses.find((item) => item.slug === route.segments[0]);
        title = academyMeta ? `${academyMeta.title} — Academia — MOSCATELLI ATLAS` : academyCourse ? `${academyCourse.title} — Academia — MOSCATELLI ATLAS` : 'Academia — MOSCATELLI ATLAS';
        markup = await academiaPathTemplate(route.segments[0]);
        break;
      }
      default:
        title = 'Not found — MOSCATELLI ATLAS';
        markup = placeholderTemplate({ eyebrow: '404', title: 'This Atlas route does not exist.', summary: 'The address is not recognised by the current application router.', note: 'Use the Browse menu or return home.' });
    }
  } catch (error) {
    console.error('[Atlas] Route rendering failed:', error);
    if (route.name === 'library' || route.name === 'library-category' || route.name === 'article' || route.name === 'playbooks' || route.name === 'playbook' || route.name === 'academia' || route.name === 'academia-path' || route.name === 'updates') {
      markup = libraryErrorTemplate();
      title = 'Atlas content unavailable — MOSCATELLI ATLAS';
    } else {
      markup = placeholderTemplate({ eyebrow: 'Atlas', title: 'This view could not be prepared.', summary: 'An unexpected development-preview error occurred while rendering the route.', note: 'Check the browser console for the captured error.' });
    }
  }

  commitRoute(markup, title, serial);
}

function updateNavigationState(route) {
  if (!route) return;
  document.querySelectorAll('[data-route-link]').forEach((link) => {
    const href = link.getAttribute('href') || '';
    const routePath = href.replace(/^#/, '');
    const isExact = routePath === route.pathname;
    const isSection = (route.name === 'library-category' && routePath === '/library') || (route.name === 'playbook' && routePath === '/playbooks') || (route.name === 'academia-path' && routePath === '/academia');
    if (isExact || isSection) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  const mobileSearch = document.querySelector('[data-mobile-search]');
  if (route.name === 'search') mobileSearch?.setAttribute('aria-current', 'page');
  else mobileSearch?.removeAttribute('aria-current');
}

function trapDialogTab(dialog, event) {
  if (!dialog?.open || event.key !== 'Tab') return;
  const selector = [
    'a[href]:not([tabindex="-1"])',
    'button:not([disabled]):not([tabindex="-1"])',
    'input:not([disabled]):not([tabindex="-1"])',
    'select:not([disabled]):not([tabindex="-1"])',
    'textarea:not([disabled]):not([tabindex="-1"])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');
  const focusable = [...dialog.querySelectorAll(selector)].filter((element) => {
    const style = getComputedStyle(element);
    return style.visibility !== 'hidden' && style.display !== 'none' && element.getClientRects().length > 0;
  });
  if (!focusable.length) { event.preventDefault(); dialog.focus?.(); return; }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;
  if (event.shiftKey && (active === first || !dialog.contains(active))) {
    event.preventDefault(); last.focus();
  } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
    event.preventDefault(); first.focus();
  }
}

function openMenu(event) {
  if (!menu || menu.open) return;
  lastMenuOpener = event?.currentTarget instanceof HTMLElement ? event.currentTarget : document.activeElement;
  menu.showModal();
  requestAnimationFrame(() => menu.querySelector('[data-menu-close]')?.focus());
}

function closeMenu() {
  if (menu?.open) closeDialogWithMotion(menu, () => menu.close());
}

function searchOptionMarkup({ label, query, kind }, index) {
  const safeLabel = escapeHTML(label);
  const safeQuery = escapeHTML(query);
  const icon = kind === 'recent'
    ? '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 7v5l3 2m5-2a8 8 0 1 1-2.34-5.66" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    : '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="m21 21-4.35-4.35m1.35-5.15A6.5 6.5 0 1 1 5 11.5a6.5 6.5 0 0 1 13 0Z" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round"/></svg>';
  return `<button class="search-suggestion" id="atlas-search-option-${index}" type="button" role="option" tabindex="-1" aria-selected="false" data-search-option data-search-query="${safeQuery}" data-search-kind="${kind}"><span class="search-suggestion__icon">${icon}</span><span class="search-suggestion__label">${safeLabel}</span><span class="search-suggestion__arrow" aria-hidden="true">↗</span></button>`;
}

function bindHomeSearch() {
  const shell = outlet.querySelector('[data-search-experience]');
  const form = shell?.querySelector('[data-home-search-form]');
  const input = form?.querySelector('input[name="q"]');
  const disclosure = shell?.querySelector('[data-search-disclosure]');
  const note = outlet.querySelector('#search-preview-note');
  const homeView = outlet.querySelector('.home-view');
  if (!shell || !form || !input || !disclosure) return;

  const controller = new AbortController();
  searchInteractionController = controller;
  const { signal } = controller;
  let activeIndex = -1;

  function options() { return [...disclosure.querySelectorAll('[data-search-option]')]; }
  function clearActiveOption() {
    options().forEach((option) => { option.dataset.active = 'false'; option.setAttribute('aria-selected', 'false'); });
    activeIndex = -1;
    input.removeAttribute('aria-activedescendant');
  }
  function setActiveOption(index) {
    const items = options();
    if (!items.length) return;
    activeIndex = (index + items.length) % items.length;
    items.forEach((option, optionIndex) => {
      const active = optionIndex === activeIndex;
      option.dataset.active = String(active);
      option.setAttribute('aria-selected', String(active));
    });
    input.setAttribute('aria-activedescendant', items[activeIndex].id);
    items[activeIndex].scrollIntoView({ block: 'nearest' });
  }
  function closeDisclosure() {
    disclosure.hidden = true;
    form.dataset.open = 'false';
    input.setAttribute('aria-expanded', 'false');
    homeView?.removeAttribute('data-search-active');
    clearActiveOption();
  }
  function renderDisclosure() {
    const rawQuery = input.value.trim();
    const recent = readRecentSearches();
    const matching = rawQuery
      ? HOME_SEARCH_SUGGESTIONS.filter((item) => `${item.label} ${item.query}`.toLocaleLowerCase().includes(rawQuery.toLocaleLowerCase()))
      : HOME_SEARCH_SUGGESTIONS;
    const groups = [];
    let optionIndex = 0;
    if (rawQuery) {
      groups.push(`<div class="search-disclosure__group"><p class="search-disclosure__label">Search</p>${searchOptionMarkup({ label: `Search Atlas for “${rawQuery}”`, query: rawQuery, kind: 'query' }, optionIndex++)}</div>`);
    } else if (recent.length) {
      groups.push(`<div class="search-disclosure__group"><p class="search-disclosure__label">Recent</p>${recent.map((query) => searchOptionMarkup({ label: query, query, kind: 'recent' }, optionIndex++)).join('')}</div>`);
    }
    if (matching.length) {
      groups.push(`<div class="search-disclosure__group${groups.length ? ' search-disclosure__group--divided' : ''}"><p class="search-disclosure__label">${rawQuery ? 'Suggested' : 'Try asking Atlas'}</p>${matching.slice(0, rawQuery ? 3 : 4).map((item) => searchOptionMarkup({ ...item, kind: 'suggested' }, optionIndex++)).join('')}</div>`);
    }
    disclosure.innerHTML = groups.join('');
    disclosure.hidden = false;
    form.dataset.open = 'true';
    input.setAttribute('aria-expanded', 'true');
    homeView?.setAttribute('data-search-active', 'true');
    clearActiveOption();
  }
  function runSearch(query) {
    const clean = query.trim();
    if (!clean) {
      if (note) note.textContent = 'Enter a search term to continue.';
      renderDisclosure();
      input.focus();
      return;
    }
    rememberSearch(clean);
    navigate(`/search?q=${encodeURIComponent(clean)}`);
  }

  form.addEventListener('submit', (event) => { event.preventDefault(); const active = options()[activeIndex]; runSearch(active?.dataset.searchQuery || input.value); }, { signal });
  input.addEventListener('focus', () => { if (note) note.textContent = ''; renderDisclosure(); }, { signal });
  input.addEventListener('input', () => { if (note) note.textContent = ''; renderDisclosure(); }, { signal });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') { event.preventDefault(); if (disclosure.hidden) renderDisclosure(); setActiveOption(activeIndex + 1); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); if (disclosure.hidden) renderDisclosure(); setActiveOption(activeIndex <= 0 ? options().length - 1 : activeIndex - 1); }
    else if (event.key === 'Escape') { event.preventDefault(); closeDisclosure(); }
  }, { signal });
  disclosure.addEventListener('click', (event) => { const option = event.target.closest('[data-search-option]'); if (option) runSearch(option.dataset.searchQuery || ''); }, { signal });
  shell.addEventListener('focusout', (event) => {
    if (event.relatedTarget && shell.contains(event.relatedTarget)) return;
    window.setTimeout(() => { if (!shell.contains(document.activeElement)) closeDisclosure(); }, 0);
  }, { signal });
  document.addEventListener('pointerdown', (event) => { if (!shell.contains(event.target)) closeDisclosure(); }, { signal });
}

function bindLibraryFilter() {
  const input = outlet.querySelector('[data-library-filter]');
  const list = outlet.querySelector('[data-library-list]');
  const count = outlet.querySelector('[data-library-count]');
  const countNoun = outlet.querySelector('[data-library-count-noun]');
  const empty = outlet.querySelector('[data-library-empty]');
  if (!input || !list || !count || !empty) return;

  const controller = new AbortController();
  routeInteractionController = controller;
  const { signal } = controller;
  const items = [...list.querySelectorAll('[data-library-item]')];

  const applyFilter = () => {
    const query = input.value.trim().toLocaleLowerCase();
    let visible = 0;
    items.forEach((item) => {
      const show = !query || item.dataset.libraryText.includes(query);
      item.hidden = !show;
      if (show) visible += 1;
    });
    count.textContent = String(visible);
    if (countNoun) countNoun.textContent = t(visible === 1 ? 'reference' : 'references');
    empty.hidden = visible !== 0;
  };

  input.addEventListener('input', applyFilter, { signal });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && input.value) {
      event.preventDefault();
      input.value = '';
      applyFilter();
    }
  }, { signal });
}



function bindPlaybooksFilter() {
  const input = outlet.querySelector('[data-playbooks-filter]');
  const list = outlet.querySelector('[data-playbooks-list]');
  const count = outlet.querySelector('[data-playbooks-count]');
  const noun = outlet.querySelector('[data-playbooks-count-noun]');
  const empty = outlet.querySelector('[data-playbooks-empty]');
  if (!input || !list || !count || !empty) return;

  const controller = new AbortController();
  routeInteractionController = controller;
  const { signal } = controller;
  const items = [...list.querySelectorAll('[data-playbook-list-item]')];
  const applyFilter = () => {
    const query = input.value.trim().toLocaleLowerCase();
    let visible = 0;
    items.forEach((item) => {
      const show = !query || item.dataset.playbookText.includes(query);
      item.hidden = !show;
      if (show) visible += 1;
    });
    count.textContent = String(visible);
    if (noun) noun.textContent = visible === 1 ? 'playbook' : 'playbooks';
    empty.hidden = visible !== 0;
  };
  input.addEventListener('input', applyFilter, { signal });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && input.value) { event.preventDefault(); input.value = ''; applyFilter(); }
  }, { signal });
}

function bindSearchRoute() {
  const form = outlet.querySelector('[data-search-route-form]');
  const input = outlet.querySelector('[data-search-route-input]');
  const subject = outlet.querySelector('[data-search-subject-filter]');
  const resultLinks = [...outlet.querySelectorAll('[data-search-result-link]')];
  if (!form || !input || !subject) return;

  const controller = new AbortController();
  routeInteractionController = controller;
  const { signal } = controller;

  const run = () => {
    const clean = input.value.trim();
    if (clean) rememberSearch(clean);
    const params = new URLSearchParams();
    if (clean) params.set('q', clean);
    if (subject.value) params.set('subject', subject.value);
    navigate(`/search${params.toString() ? `?${params.toString()}` : ''}`);
  };

  form.addEventListener('submit', (event) => { event.preventDefault(); run(); }, { signal });
  subject.addEventListener('change', run, { signal });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' && resultLinks.length) {
      event.preventDefault();
      resultLinks[0].focus();
    }
  }, { signal });

  resultLinks.forEach((link, index) => {
    link.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown' && resultLinks[index + 1]) { event.preventDefault(); resultLinks[index + 1].focus(); }
      else if (event.key === 'ArrowUp') { event.preventDefault(); (resultLinks[index - 1] || input).focus(); }
      else if (event.key === 'Escape') { event.preventDefault(); input.focus(); }
    }, { signal });
  });
}


function bindAcademiaLesson() {
  const root = outlet.querySelector('[data-academia-lesson]');
  if (!root) return;
  const completeButton = root.querySelector('[data-academia-complete]');
  const ackButton = root.querySelector('[data-academia-ack]');
  const status = root.querySelector('[data-academia-lesson-status]');
  const ackNote = root.querySelector('[data-academia-ack-note]');
  const slug = root.dataset.lessonSlug || '';
  const controller = new AbortController();
  routeInteractionController = controller;
  const { signal } = controller;

  const update = () => {
    const state=readAcademiaProgress();
    const complete=state.completed.includes(slug);
    const acknowledged=state.acknowledged.includes(slug);
    if (completeButton) { completeButton.setAttribute('aria-pressed', String(complete)); completeButton.textContent = complete ? 'Completed' : 'Mark lesson complete'; }
    if (status) status.textContent = complete ? 'Completed' : 'Not completed';
    if (ackButton) { ackButton.setAttribute('aria-pressed', String(acknowledged)); ackButton.textContent = acknowledged ? 'Acknowledged' : 'Acknowledge reading'; }
    if (ackNote) ackNote.textContent = acknowledged ? 'Acknowledgement recorded in local demo state.' : 'This demonstration lesson includes an acknowledgement requirement.';
  };

  completeButton?.addEventListener('click', () => {
    const state=readAcademiaProgress();
    state.completed = state.completed.includes(slug) ? state.completed.filter((item)=>item!==slug) : [...state.completed,slug];
    writeAcademiaProgress(state); update(); pulseState(completeButton);
  }, { signal });
  ackButton?.addEventListener('click', () => {
    const state=readAcademiaProgress();
    state.acknowledged = state.acknowledged.includes(slug) ? state.acknowledged.filter((item)=>item!==slug) : [...state.acknowledged,slug];
    writeAcademiaProgress(state); update(); pulseState(ackButton);
  }, { signal });
}

function bindArticleReader() {
  const root = outlet.querySelector('[data-article-root]');
  const reading = outlet.querySelector('[data-article-reading]');
  const progress = outlet.querySelector('[data-article-progress]');
  const bar = outlet.querySelector('[data-article-progress-bar]');
  const label = outlet.querySelector('[data-article-progress-label]');
  const tocLinks = [...outlet.querySelectorAll('[data-article-toc-target]')];
  const sections = [...outlet.querySelectorAll('[data-article-section]')];
  if (!root || !reading) return;

  const controller = new AbortController();
  routeInteractionController = controller;
  const { signal } = controller;
  const slug = root.dataset.articleSlug || '';

  const setTocActive = (id) => {
    tocLinks.forEach((link) => {
      const active = link.dataset.articleTocTarget === id;
      link.dataset.active = String(active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };

  tocLinks.forEach((link) => {
    link.addEventListener('click', () => {
      const target = outlet.querySelector(`#${CSS.escape(link.dataset.articleTocTarget || '')}`);
      if (!target) return;
      target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      outlet.querySelector('.article-toc-mobile[open]')?.removeAttribute('open');
    }, { signal });
  });

  const stopProgress = trackReadingProgress({
    slug,
    root: reading,
    onUpdate: (value, percent) => {
      if (bar) bar.style.setProperty('--article-progress-ratio', String(value));
      if (progress) progress.setAttribute('aria-valuenow', String(percent));
      if (label) label.textContent = `${percent}%`;
    },
  });
  signal.addEventListener('abort', stopProgress, { once: true });

  if ('IntersectionObserver' in window && sections.length) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setTocActive(visible[0].target.id);
    }, { rootMargin: '-18% 0px -66% 0px', threshold: [0, 0.15, 0.5] });
    sections.forEach((section) => observer.observe(section));
    signal.addEventListener('abort', () => observer.disconnect(), { once: true });
    setTocActive(sections[0].id);
  }
}


function globalSearchSuggestionMarkup(query, label = query) {
  return `<button type="button" class="global-search-starter" data-global-search-query="${escapeHTML(query)}"><span>${escapeHTML(label)}</span><i aria-hidden="true">↗</i></button>`;
}

async function renderGlobalSearchResults(query = '') {
  const resultsRoot = globalSearchDialog?.querySelector('[data-global-search-results]');
  if (!resultsRoot) return;
  const serial = ++globalSearchRenderSerial;
  const clean = query.trim();

  if (!clean) {
    const recent = readRecentSearches();
    resultsRoot.innerHTML = `
      ${recent.length ? `<section class="global-search-group"><p>Recent</p>${recent.map((item) => globalSearchSuggestionMarkup(item)).join('')}</section>` : ''}
      <section class="global-search-group"><p>Try asking Atlas</p>${HOME_SEARCH_SUGGESTIONS.slice(0, 4).map((item) => globalSearchSuggestionMarkup(item.query, item.label)).join('')}</section>`;
    return;
  }

  resultsRoot.innerHTML = '<p class="global-search-loading" role="status">Searching Atlas…</p>';
  const resultSet = await searchAtlas(clean, { limit: 5 });
  if (serial !== globalSearchRenderSerial || !globalSearchDialog?.open) return;
  resultsRoot.innerHTML = resultSet.results.length
    ? `<div class="global-search-result-list" role="list">${resultSet.results.map((item) => searchResultMarkup(item, resultSet.terms.expanded, { compact: true })).join('')}</div><a class="global-search-all" href="#/search?q=${encodeURIComponent(clean)}" data-route-link>View all ${resultSet.total} ${resultSet.total === 1 ? 'result' : 'results'} →</a>`
    : `<div class="global-search-none" role="status"><strong>No direct match.</strong><a href="#/search?q=${encodeURIComponent(clean)}" data-route-link>Open full Search →</a></div>`;
}

function openGlobalSearch() {
  if (!globalSearchDialog || globalSearchDialog.open) return;
  lastGlobalSearchOpener = menu?.open ? document.querySelector('[data-menu-open]') : document.activeElement;
  closeMenu();
  globalSearchDialog.showModal();
  const input = globalSearchDialog.querySelector('[data-global-search-input]');
  if (input) input.value = '';
  renderGlobalSearchResults('');
  input?.focus({ preventScroll: true });
}

function closeGlobalSearch() {
  if (globalSearchDialog?.open) closeDialogWithMotion(globalSearchDialog, () => globalSearchDialog.close());
}

function bindGlobalSearch() {
  if (!globalSearchDialog) return;
  const form = globalSearchDialog.querySelector('[data-global-search-form]');
  const input = globalSearchDialog.querySelector('[data-global-search-input]');
  const resultsRoot = globalSearchDialog.querySelector('[data-global-search-results]');
  if (!form || !input || !resultsRoot) return;

  let inputTimer = 0;
  globalSearchOpeners.forEach((button) => button.addEventListener('click', openGlobalSearch));
  globalSearchCloser?.addEventListener('click', closeGlobalSearch);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const clean = input.value.trim();
    if (!clean) return;
    rememberSearch(clean);
    if (globalSearchDialog?.open) globalSearchDialog.close();
    navigate(`/search?q=${encodeURIComponent(clean)}`);
  });

  input.addEventListener('input', () => {
    window.clearTimeout(inputTimer);
    inputTimer = window.setTimeout(() => renderGlobalSearchResults(input.value), 70);
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      const first = resultsRoot.querySelector('[data-search-result-link], [data-global-search-query], .global-search-all');
      if (first) { event.preventDefault(); first.focus(); }
    }
  });

  resultsRoot.addEventListener('keydown', (event) => {
    const focusables = [...resultsRoot.querySelectorAll('[data-search-result-link], [data-global-search-query], .global-search-all, .global-search-none a')];
    const current = focusables.indexOf(document.activeElement);
    if (event.key === 'ArrowDown' && current >= 0 && focusables[current + 1]) { event.preventDefault(); focusables[current + 1].focus(); }
    else if (event.key === 'ArrowUp' && current >= 0) { event.preventDefault(); (focusables[current - 1] || input).focus(); }
  });

  resultsRoot.addEventListener('click', (event) => {
    const starter = event.target.closest('[data-global-search-query]');
    if (starter) {
      input.value = starter.dataset.globalSearchQuery || '';
      renderGlobalSearchResults(input.value);
      input.focus();
      return;
    }
    if (event.target.closest('[data-route-link]') && globalSearchDialog?.open) globalSearchDialog.close();
  });

  globalSearchDialog.addEventListener('click', (event) => { if (event.target === globalSearchDialog) closeGlobalSearch(); });
  globalSearchDialog.addEventListener('keydown', (event) => { trapDialogTab(globalSearchDialog, event); if (event.key === 'Escape') { event.preventDefault(); closeGlobalSearch(); } });
  globalSearchDialog.addEventListener('close', () => {
    globalSearchRenderSerial += 1;
    const target = lastGlobalSearchOpener;
    lastGlobalSearchOpener = null;
    if (target instanceof HTMLElement && document.contains(target)) target.focus({ preventScroll: true });
  });

  document.addEventListener('keydown', (event) => {
    const target = event.target;
    const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target?.isContentEditable;
    if (event.key !== '/' || isTyping || event.metaKey || event.ctrlKey || event.altKey) return;
    event.preventDefault();
    const route = window.__ATLAS_CURRENT_ROUTE__;
    if (route?.name === 'home') outlet.querySelector('#atlas-home-search')?.focus();
    else if (route?.name === 'search') outlet.querySelector('[data-search-route-input]')?.focus();
    else openGlobalSearch();
  });
}


function bindBookmarkControls(){
  outlet.querySelectorAll('[data-bookmark-toggle]').forEach((button)=>{
    button.addEventListener('click',()=>{
      const item={type:button.dataset.bookmarkType||'reference',slug:button.dataset.bookmarkSlug||'',title:button.dataset.bookmarkTitle||'',summary:button.dataset.bookmarkSummary||'',route:button.dataset.bookmarkRoute||'',context:button.dataset.bookmarkContext||''};
      const state=toggleBookmark(item); button.setAttribute('aria-pressed',String(state.saved));
      const label=button.querySelector('[data-bookmark-label]'); if(label) label.textContent=state.saved?'Saved':'Save';
      const mark=button.querySelector('span[aria-hidden="true"]'); if(mark) mark.textContent=state.saved?'●':'○'; pulseState(button);
    });
  });
}
function bindUpdates(){
  const root=outlet.querySelector('[data-updates-view]'); if(!root) return;
  root.querySelectorAll('[data-update-filter]').forEach((button)=>button.addEventListener('click',()=>{const value=button.dataset.updateFilter||'all';navigate(`/updates${value==='all'?'':`?filter=${encodeURIComponent(value)}`}`);}));
  root.querySelectorAll('[data-update-ack]').forEach((button)=>button.addEventListener('click',async()=>{const slug=button.dataset.updateAck||'';const update=(await getUpdates()).find((item)=>item.slug===slug);const saved=!readUpdateAcknowledgements().includes(slug);button.disabled=true;try{await setAcknowledgement(slug,update?.version||'1.0',saved);button.setAttribute('aria-pressed',String(saved));button.textContent=saved?'Acknowledged':'Acknowledge reading';pulseState(button);}finally{button.disabled=false;}}));
  root.querySelectorAll('[data-slack-notify]').forEach((button)=>button.addEventListener('click',async()=>{button.disabled=true;const original=button.textContent;button.textContent='Sending…';try{const method=button.dataset.slackKind==='required'?'notifyRequiredReading':'notifyImportantUpdate';await slackAdapter[method]({updateId:button.dataset.slackNotify});button.textContent='Sent to Slack';}catch(error){button.textContent='Retry Slack';console.error('[Atlas] Slack delivery failed:',error);}finally{button.disabled=false;window.setTimeout(()=>{button.textContent=original;},3200);}}));
  const focused=root.querySelector('[data-focus="true"]'); if(focused) window.setTimeout(()=>focused.scrollIntoView({block:'center',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}),0);
}

function bindAuthSignOutControls(scope = document) {
  scope.querySelectorAll('[data-auth-signout]').forEach((button) => {
    if (button.dataset.authBound === 'true') return;
    button.dataset.authBound = 'true';
    button.addEventListener('click', () => { void signOutAtlas().catch(() => {}); });
  });
}

function bindRouteControls(route) {
  if (route?.name === 'home') bindHomeSearch();
  if (route?.name === 'library' || route?.name === 'library-category') bindLibraryFilter();
  if (route?.name === 'search') bindSearchRoute();
  if (route?.name === 'playbooks') bindPlaybooksFilter();
  if (route?.name === 'article') bindArticleReader();
  if (route?.name === 'academia-path') bindAcademiaLesson();
  if (route?.name === 'updates') bindUpdates();
  bindBookmarkControls();
  bindAuthSignOutControls(outlet);
}

let atlasApplicationStarted = false;

async function startAtlasApplication() {
  if (atlasApplicationStarted) return firstRouteReady;
  atlasApplicationStarted = true;
  await Promise.all([hydrateBookmarks(), hydrateReadingProgress(), hydrateAcknowledgements()]);

  document.addEventListener('click', (event) => {
    const link = event.target.closest?.('[data-route-link]');
    if (link) prepareRouteMotion(link);
  }, true);

  menuOpeners.forEach((button) => button.addEventListener('click', openMenu));
  menuCloser?.addEventListener('click', closeMenu);
  menu?.addEventListener('click', (event) => {
    if (event.target === menu) closeMenu();
    const routeLink = event.target.closest('[data-route-link]');
    if (routeLink && menu?.open) menu.close();
  });
  menu?.addEventListener('keydown', (event) => trapDialogTab(menu, event));
  menu?.addEventListener('close', () => {
    const target = lastMenuOpener;
    lastMenuOpener = null;
    if (target instanceof HTMLElement && document.contains(target)) target.focus({ preventScroll: true });
  });

  bindSkipLink();
  bindGlobalSearch();
  bindAuthSignOutControls(document);
  void initPWA();

  startRouter(renderRoute);
  return firstRouteReady;
}

void (async () => {
  await prepareAuthProvider();
  await initAuthenticationThreshold({ onAuthenticated: startAtlasApplication });
})().catch((error) => {
  console.error('[Atlas] Authentication threshold failed to initialise:', error);
});
