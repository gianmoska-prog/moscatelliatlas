import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

describe('authentication arrival experience', () => {
  it('uses a dedicated session-check surface instead of flashing the sign-in form', async () => {
    const [html, css, auth] = await Promise.all([
      read('index.html'),
      read('assets/css/auth.css'),
      read('assets/js/auth-gate.js'),
    ]);

    expect(html).toContain('class="auth-check" data-auth-check');
    expect(html).toContain('Preparing your Atlas');
    expect(css).toContain('.auth-gate[data-state="checking"] .auth-panel { display: none; }');
    expect(css).toContain('.auth-gate[data-state="checking"] .auth-check');
    expect(auth).toContain('const AUTO_AUTH_MINIMUM_MS = 900');
    expect(auth).toContain('await waitForMinimum(sessionCheckStartedAt');
  });

  it('adapts MainHub’s post-auth welcome to Atlas and localises it', async () => {
    const [html, css, auth, i18n] = await Promise.all([
      read('index.html'),
      read('assets/css/auth.css'),
      read('assets/js/auth-gate.js'),
      read('assets/js/i18n.js'),
    ]);

    expect(html).toContain('class="atlas-welcome" data-atlas-welcome');
    expect(css).toContain('.atlas-welcome[data-visible="true"]');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(auth).toContain("t('Welcome back, {name}')");
    expect(auth).toContain('showWelcome(session?.user)');
    expect(i18n).toContain("'Welcome back, {name}':'È bello rivederti, {name}'");
    expect(i18n).toContain("'Welcome back, {name}':'Que bom ter você de volta, {name}'");
  });

  it('versions changed CSS and module entry points for already-cached clients', async () => {
    const [html, app, auth] = await Promise.all([
      read('index.html'),
      read('assets/js/app.js'),
      read('assets/js/auth-gate.js'),
    ]);

    expect(html).toContain('assets/js/app.js?v=1.9.0');
    expect(app).toContain("./auth-gate.js?v=1.9.0");
    expect(app).toContain("./i18n.js?v=1.9.0");
    expect(auth).toContain("./i18n.js?v=1.9.0");
  });
});
