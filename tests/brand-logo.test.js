import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url));

describe('Atlas brand wordmark', () => {
  it('ships the supplied transparent wordmark throughout the shell', async () => {
    const [htmlBuffer, serviceWorkerBuffer, logo] = await Promise.all([
      read('index.html'),
      read('sw.js'),
      read('assets/brand/atlas-wordmark.png'),
    ]);
    const html = htmlBuffer.toString('utf8');
    const serviceWorker = serviceWorkerBuffer.toString('utf8');

    expect(html.match(/assets\/brand\/atlas-wordmark\.png/g)).toHaveLength(4);
    expect(html).toContain('class="atlas-logo atlas-logo--auth"');
    expect(html).toContain('class="atlas-logo atlas-logo--header"');
    expect(html).toContain('class="atlas-logo atlas-logo--menu"');
    expect(html.match(/rel="stylesheet" href="[^"]+\?v=1\.10\.2"/g)).toHaveLength(11);
    expect(serviceWorker).toContain("'./assets/brand/atlas-wordmark.png'");
    expect(serviceWorker).toContain("atlas-shell-v1.10.2");
    expect(logo.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    expect(logo.byteLength).toBeGreaterThan(10_000);
  });

  it('centres the header wordmark independently of its actions', async () => {
    const [layoutBuffer, componentBuffer] = await Promise.all([
      read('assets/css/layout.css'),
      read('assets/css/components.css'),
    ]);
    const layout = layoutBuffer.toString('utf8');
    const components = componentBuffer.toString('utf8');

    expect(layout).toContain('grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr)');
    expect(layout).toContain('grid-column: 3');
    expect(components).toContain('grid-column: 2');
    expect(components).toContain('justify-self: center');
  });
});
