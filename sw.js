const VERSION = 'atlas-shell-v1.3.3';
const SHELL_CACHE = `${VERSION}-static`;

const SHELL_ASSETS = [
  './',
  './index.html',
  './offline.html',
  './manifest.webmanifest',
  './assets/css/tokens.css',
  './assets/css/reset.css',
  './assets/css/base.css',
  './assets/css/layout.css',
  './assets/css/components.css',
  './assets/css/pages.css',
  './assets/css/motion.css',
  './assets/css/responsive.css',
  './assets/css/accessibility.css',
  './assets/css/auth.css',
  './assets/css/mobile.css',
  './assets/js/config.js',
  './assets/js/app.js',
  './assets/js/i18n.js',
  './assets/vendor/supabase.js',
  './assets/js/router.js',
  './assets/js/store.js',
  './assets/js/content-service.js',
  './assets/js/search.js',
  './assets/js/motion.js',
  './assets/js/bookmarks.js',
  './assets/js/history.js',
  './assets/js/reading-progress.js',
  './assets/js/acknowledgements.js',
  './assets/js/auth-adapter.js',
  './assets/js/auth-gate.js',
  './assets/js/auth-provider.js',
  './assets/js/integration-adapter.js',
  './assets/js/integrations/errors.js',
  './assets/js/integrations/supabase.js',
  './assets/js/integrations/mainhub.js',
  './assets/js/integrations/slack.js',
  './assets/js/integrations/gmail.js',
  './assets/js/pwa.js',
  './assets/js/utils.js',
  './assets/icons/atlas-temp-192.png',
  './assets/icons/atlas-temp-512.png',
  './assets/icons/atlas-temp-maskable-512.png'
];

const scopeURL = (path) => new URL(path, self.registration.scope).href;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS.map(scopeURL))));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith('atlas-shell-') && name !== SHELL_CACHE).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

function isSensitiveOrPrivate(url) {
  const path = url.pathname;
  return path.includes('/content/') ||
    path.includes('/api/') ||
    path.includes('/auth/') ||
    path.includes('/rest/v1/') ||
    path.includes('/storage/v1/') ||
    path.includes('/functions/v1/');
}

function isStaticShellAsset(url) {
  const path = url.pathname;
  return path.includes('/assets/css/') ||
    path.includes('/assets/js/') ||
    path.includes('/assets/icons/') ||
    path.endsWith('/manifest.webmanifest') ||
    path.endsWith('/offline.html');
}

async function navigationResponse(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch {
    return (await caches.match(scopeURL('./index.html'))) || (await caches.match(scopeURL('./offline.html'))) || Response.error();
  }
}

async function shellAssetResponse(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && response.type === 'basic') {
    const cache = await caches.open(SHELL_CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never place knowledge payloads, authenticated data or future API responses in Cache Storage.
  if (isSensitiveOrPrivate(url)) {
    // Internal knowledge and future authenticated/provider responses are network-only
    // and explicitly bypass the browser HTTP cache as well as Cache Storage.
    event.respondWith(fetch(request, { cache: 'no-store' }));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(navigationResponse(request));
    return;
  }

  if (isStaticShellAsset(url)) {
    event.respondWith(shellAssetResponse(request));
  }
});
