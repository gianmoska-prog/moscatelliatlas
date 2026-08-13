import { describe, expect, it } from 'vitest';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

async function jsonFiles(directory) {
  return (await readdir(directory, { recursive: true }))
    .filter((file) => file.endsWith('.json'))
    .map((file) => file.replaceAll('\\', '/'))
    .sort();
}

describe('Atlas localized content', () => {
  it.each(['it', 'pt-BR'])('%s mirrors every English JSON document and preserves identifiers', async (locale) => {
    const english = (await jsonFiles('content')).filter((file) => !file.startsWith('locales/'));
    const localized = await jsonFiles(path.join('content', 'locales', locale));
    expect(localized).toEqual(english);

    for (const file of english) {
      const [source, translation] = await Promise.all([
        readFile(path.join('content', file), 'utf8').then(JSON.parse),
        readFile(path.join('content', 'locales', locale, file), 'utf8').then(JSON.parse),
      ]);
      for (const key of ['id', 'slug', 'type']) {
        if (source[key] !== undefined) expect(translation[key]).toBe(source[key]);
      }
    }
  });
});
