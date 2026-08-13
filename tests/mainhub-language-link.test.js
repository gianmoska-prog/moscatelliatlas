import { describe, expect, it } from 'vitest';
import { linkedLocale, localeURL } from '../assets/js/i18n.js';

describe('MainHub language handoff', () => {
  it.each([
    ['?lang=en', 'en'],
    ['?lang=pt-BR', 'pt-BR'],
    ['?source=mainhub&lang=pt-BR', 'pt-BR'],
  ])('accepts a supported language from %s', (search, expected) => {
    expect(linkedLocale(search)).toBe(expected);
  });

  it.each(['', '?lang=it', '?lang=PT-br', '?lang=invalid'])('safely ignores %s', (search) => {
    expect(linkedLocale(search)).toBeNull();
  });

  it('preserves search parameters and hash routes when the locale changes', () => {
    expect(localeURL('pt-BR', 'https://atlas.example/?source=mainhub#/library'))
      .toBe('https://atlas.example/?source=mainhub&lang=pt-BR#/library');
    expect(localeURL('en', 'https://atlas.example/?lang=pt-BR#/article/welcome'))
      .toBe('https://atlas.example/?lang=en#/article/welcome');
  });

  it('removes the MainHub parameter when Italian is selected inside Atlas', () => {
    expect(localeURL('it', 'https://atlas.example/?source=mainhub&lang=pt-BR#/profile'))
      .toBe('https://atlas.example/?source=mainhub#/profile');
  });
});
