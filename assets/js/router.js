import { ATLAS_CONFIG } from './config.js';

const ROUTE_PATTERNS = Object.freeze([
  { name: 'home', pattern: /^\/home\/?$/ },
  { name: 'library-category', pattern: /^\/library\/([^/]+)\/?$/ },
  { name: 'library', pattern: /^\/library\/?$/ },
  { name: 'article', pattern: /^\/article\/([^/]+)\/?$/ },
  { name: 'playbook', pattern: /^\/playbook\/([^/]+)\/?$/ },
  { name: 'playbooks', pattern: /^\/playbooks\/?$/ },
  { name: 'academia-path', pattern: /^\/academia\/([^/]+)\/?$/ },
  { name: 'academia', pattern: /^\/academia\/?$/ },
  { name: 'updates', pattern: /^\/updates\/?$/ },
  { name: 'bookmarks', pattern: /^\/bookmarks\/?$/ },
  { name: 'continue-reading', pattern: /^\/continue-reading\/?$/ },
  { name: 'history', pattern: /^\/history\/?$/ },
  { name: 'search', pattern: /^\/search\/?$/ },
  { name: 'profile', pattern: /^\/profile\/?$/ },
]);

export function normaliseHash(hash = window.location.hash) {
  const raw = hash.replace(/^#/, '') || ATLAS_CONFIG.defaultRoute;
  const [pathnameRaw, query = ''] = raw.split('?');
  const pathname = pathnameRaw.startsWith('/') ? pathnameRaw : `/${pathnameRaw}`;
  return { pathname, query, params: new URLSearchParams(query) };
}

function decodeRouteSegment(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

export function resolveRoute(hash = window.location.hash) {
  const location = normaliseHash(hash);
  for (const route of ROUTE_PATTERNS) {
    const match = location.pathname.match(route.pattern);
    if (match) {
      const segments = match.slice(1).map(decodeRouteSegment);
      if (segments.some((segment) => segment === null)) {
        return Object.freeze({
          name: 'not-found',
          pathname: location.pathname,
          params: location.params,
          segments: [],
          invalidEncoding: true,
        });
      }
      return Object.freeze({
        name: route.name,
        pathname: location.pathname,
        params: location.params,
        segments,
      });
    }
  }
  return Object.freeze({ name: 'not-found', pathname: location.pathname, params: location.params, segments: [] });
}

export function navigate(path) {
  const target = path.startsWith('/') ? path : `/${path}`;
  if (`#${target}` === window.location.hash) {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    return;
  }
  window.location.hash = target;
}

export function startRouter(onRoute) {
  if (typeof onRoute !== 'function') throw new TypeError('startRouter requires an onRoute callback');

  const handleRoute = () => onRoute(resolveRoute());
  window.addEventListener('hashchange', handleRoute);

  if (!window.location.hash) {
    window.history.replaceState(null, '', `#${ATLAS_CONFIG.defaultRoute}`);
  }

  handleRoute();

  return () => window.removeEventListener('hashchange', handleRoute);
}

export const routerStatus = Object.freeze({ implemented: true, hashBased: true });
