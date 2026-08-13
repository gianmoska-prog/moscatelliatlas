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

  it('cancels superseded route transitions and prevents double animation', async () => {
    const [motion, css] = await Promise.all([
      read('assets/js/motion.js'),
      read('assets/css/motion.css'),
    ]);

    expect(motion).toContain('activeRouteTransition.skipTransition?.()');
    expect(css).toContain('html:not([data-atlas-route-transition="true"])');
    expect(css).toContain('@keyframes atlas-root-old { to { opacity: 0; } }');
  });
});
