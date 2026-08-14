import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

describe('transition stability', () => {
  it('waits for the first route before unlocking the authenticated surface', async () => {
    const [app, auth] = await Promise.all([
      read('assets/js/app.js'),
      read('assets/js/auth-gate.js'),
    ]);

    expect(app).toContain('return firstRouteReady');
    expect(app).toContain("outlet.dataset.initialRoute = 'true'");
    expect(auth).toContain('await onAuthenticatedCallback?.');
    expect(auth.indexOf('await onAuthenticatedCallback?.')).toBeLessThan(auth.indexOf("dataset.authState = 'authenticated'"));
  });

  it('uses a sequential outlet-only transition and prevents double animation', async () => {
    const [motion, css] = await Promise.all([
      read('assets/js/motion.js'),
      read('assets/css/motion.css'),
    ]);

    expect(motion).toContain('const inheritedOpacity');
    expect(motion).toContain("outlet.dataset.routeMotion = 'leaving'");
    expect(motion).toContain("outlet.dataset.routeMotion = 'entering'");
    expect(motion).not.toContain('document.startViewTransition');
    expect(css).toContain('.route-outlet[data-route-motion]');
    expect(css).not.toContain('::view-transition-old(root)');
  });

  it('reveals the prepared app beneath the departing authentication layer', async () => {
    const auth = await read('assets/js/auth-gate.js');
    expect(auth.indexOf("dataset.authState = 'authenticated'")).toBeLessThan(auth.indexOf('if (root) root.hidden = true'));
    expect(auth).toContain("appSurface.dataset.authEntering = 'true'");
    expect(auth).toContain('avoids exposing a blank page');
  });

  it('keeps routine Supabase session events visually silent', async () => {
    const auth = await read('assets/js/auth-gate.js');

    expect(auth).toContain("event === 'TOKEN_REFRESHED'");
    expect(auth).toContain('synchroniseProviderSession(nextSession)');
    expect(auth).not.toContain('if (nextSession) await revealApplication');
    expect(auth).toContain('providerTransitionSerial += 1');
  });

  it('cancels stale route commits and binds markup to its own route', async () => {
    const [app, motion] = await Promise.all([
      read('assets/js/app.js'),
      read('assets/js/motion.js'),
    ]);

    expect(app).toContain('cancelRouteMotion(outlet)');
    expect(app).toContain('commitRoute(markup, title, serial, route)');
    expect(app).toContain('if (serial !== renderSerial) return false');
    expect(motion).toContain('if (update() === false) return false');
  });

  it('does not reload when a service worker first claims the page', async () => {
    const pwa = await read('assets/js/pwa.js');

    expect(pwa).toContain('let reloadRequested = false');
    expect(pwa).toContain('if (!reloadRequested || reloading) return');
  });

  it('resets authenticated in-memory state before account re-entry', async () => {
    const [app, store] = await Promise.all([
      read('assets/js/app.js'),
      read('assets/js/store.js'),
    ]);

    expect(app).toContain('resetBookmarks()');
    expect(app).toContain('resetReadingProgress()');
    expect(app).toContain('resetAcknowledgements()');
    expect(app).toContain('resetContentService()');
    expect(app).toContain('resetSearchIndex()');
    expect(store).toContain('identityScoped: true');
  });
});
