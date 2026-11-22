import { describe, expect, it } from 'vitest';

import {
  LINKING_PREFIXES,
  parseReciterIdParam,
  parseSurahIdParam,
} from './deep-link';

describe('deep links', () => {
  it('accepts the scheme the built APK registers', () => {
    expect(LINKING_PREFIXES).toContain('opentarteeltv://');
  });

  it('accepts the legacy scheme as an additional prefix', () => {
    expect(LINKING_PREFIXES).toContain('opentarteel://');
  });

  it('keeps source-prefixed reciter ids intact as strings', () => {
    expect(parseReciterIdParam('mp3quran-21193-10913')).toBe(
      'mp3quran-21193-10913',
    );
    expect(parseReciterIdParam('itqan-7-11')).toBe('itqan-7-11');
    expect(parseReciterIdParam('quran-foundation-42')).toBe(
      'quran-foundation-42',
    );
    // A purely numeric id must not be coerced into a number either.
    expect(parseReciterIdParam('42')).toBe('42');
  });

  it('treats a missing or empty reciter id as absent', () => {
    expect(parseReciterIdParam(undefined)).toBeUndefined();
    expect(parseReciterIdParam('')).toBeUndefined();
  });

  it('parses surah ids as numbers', () => {
    expect(parseSurahIdParam('1')).toBe(1);
    expect(parseSurahIdParam('114')).toBe(114);
  });

  it('treats missing and non-numeric surah ids as absent', () => {
    expect(parseSurahIdParam(undefined)).toBeUndefined();
    expect(parseSurahIdParam('')).toBeUndefined();
    expect(parseSurahIdParam('abc')).toBeUndefined();
  });
});
