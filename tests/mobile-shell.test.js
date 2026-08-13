import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

describe('mobile application shell', () => {
  it('ships the dedicated mobile navigation and stylesheet', async () => {
    const [html, serviceWorker] = await Promise.all([
      read('index.html'),
      read('sw.js')
    ]);

    expect(html).toContain('assets/css/mobile.css');
    expect(html).toContain('class="mobile-tabbar"');
    expect(html).toContain('data-mobile-search');
    expect(serviceWorker).toContain('./assets/css/mobile.css');
  });

  it('accounts for phone safe areas and narrow viewports', async () => {
    const css = await read('assets/css/mobile.css');

    expect(css).toContain('env(safe-area-inset-bottom');
    expect(css).toContain('@media (max-width: 340px)');
    expect(css).toContain('.mobile-tabbar');
  });
});
