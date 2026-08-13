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

  it('fully dismisses authentication before revealing the app surface', async () => {
    const auth = await read('assets/js/auth-gate.js');
    expect(auth.indexOf('if (root) root.hidden = true')).toBeLessThan(auth.indexOf("dataset.authState = 'authenticated'"));
    expect(auth).toContain("appSurface.dataset.authEntering = 'true'");
  });
});
