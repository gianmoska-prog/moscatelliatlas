import { beforeEach, describe, expect, it } from 'vitest';

globalThis.window = globalThis.window || {};

describe('Atlas search', () => {
  beforeEach(async () => {
    window.__ATLAS_CONTENT__ = {
      categories: [{ slug: 'suppliers', name: 'Suppliers' }],
      items: Array.from({ length: 6 }, (_, index) => ({
        id: `article.${index}`, slug: `supplier-${index}`, type: 'article', category: 'suppliers',
        title: `Supplier reference ${index}`, summary: 'Supplier guidance', keywords: ['supplier'],
        permissions: ['internal'], audience: ['All internal users'],
      })),
    };
    window.__ATLAS_ARTICLES__ = Object.fromEntries(window.__ATLAS_CONTENT__.items.map((item) => [item.slug, { ...item, sections: [] }]));
    const { resetLocalSearchIndexForTesting } = await import('../assets/js/search.js');
    resetLocalSearchIndexForTesting();
  });

  it('reports the full result count before applying the display limit', async () => {
    const { searchAtlas } = await import('../assets/js/search.js');
    const result = await searchAtlas('supplier', { limit: 5 });
    expect(result.results).toHaveLength(5);
    expect(result.total).toBe(6);
  });
});
