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
    expect(css).toContain('.auth-gate[data-state="ready"] .auth-panel');
    expect(css).toContain('.auth-gate[data-state="checking"] .auth-check');
    expect(css).toContain('.auth-gate[data-state="departing"] .auth-check');
    expect(css).toContain('transition-delay: 220ms, 220ms, 0s');
    expect(css).toContain('transition-delay: 230ms, 230ms, 0s');
    expect(auth).toContain('const AUTO_AUTH_MINIMUM_MS = 900');
    expect(auth).toContain('const AUTH_STAGE_MINIMUM_MS = 420');
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
    expect(i18n).toContain("'Welcome back, {name} (masculine)':'Bentornato, {name}'");
    expect(i18n).toContain("'Welcome back, {name} (feminine)':'Bentornata, {name}'");
    expect(i18n).toContain("'Welcome back, {name} (masculine)':'Bem-vindo de volta, {name}'");
    expect(i18n).toContain("'Welcome back, {name} (feminine)':'Bem-vinda de volta, {name}'");
  });

  it('versions changed CSS and module entry points for already-cached clients', async () => {
    const [html, app, auth, serviceWorker] = await Promise.all([
      read('index.html'),
      read('assets/js/app.js'),
      read('assets/js/auth-gate.js'),
      read('sw.js'),
    ]);

    expect(html).toContain('assets/js/app.js?v=1.10.1');
    expect(app).toContain("./auth-gate.js?v=1.10.1");
    expect(app).toContain("./i18n.js?v=1.10.1");
    expect(auth).toContain("./auth-adapter.js?v=1.10.1");
    expect(auth).toContain("./i18n.js?v=1.10.1");
    expect(auth).toContain("./store.js?v=1.10.1");
    expect(app).toContain("./motion.js?v=1.10.1");
    expect(serviceWorker.indexOf('const response = await fetch(request)')).toBeLessThan(serviceWorker.indexOf('return (await caches.match(request))'));
  });

  it('sources grammatical gender from the protected profile rather than guessing from names', async () => {
    const [adapter, auth, migration] = await Promise.all([
      read('assets/js/auth-adapter.js'),
      read('assets/js/auth-gate.js'),
      read('supabase/migrations/202608140001_profile_grammatical_gender.sql'),
    ]);

    expect(adapter).toContain('grammatical_gender');
    expect(auth).toContain("grammaticalGender: profile.grammatical_gender || 'neutral'");
    expect(migration).toContain("check (grammatical_gender in ('masculine', 'feminine', 'neutral'))");
    expect(migration).toContain("lower(trim(display_name)) = 'gianluca'");
  });
});
