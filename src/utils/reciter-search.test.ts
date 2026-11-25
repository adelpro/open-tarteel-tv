import { describe, expect, it } from 'vitest';

import { LinkSource, type Reciter, Riwaya } from '../types';
import { buildReciterSearchIndex, searchReciters } from './reciter-search';

function makeReciter(id: string, name: string, moshafName = 'Moshaf'): Reciter {
  return {
    id,
    name,
    source: LinkSource.MP3QURAN,
    moshaf: {
      id: Number(id),
      name: moshafName,
      riwaya: Riwaya.HAFS_A_ASIM,
      server: 'https://example.test',
      surah_total: 114,
      playlist: [],
    },
  };
}

describe('searchReciters', () => {
  it('returns the input list unchanged when the normalized query is empty', () => {
    const reciters = [
      makeReciter('1', 'Alif Laayyisa', 'Madani Mushaf'),
      makeReciter('2', 'Mishary Rashid', 'Qalun Mushaf'),
    ];
    const index = buildReciterSearchIndex(reciters, 'en');

    // The search must not filter, reorder or copy: the caller still applies
    // the riwaya/letter filters and the alphabetical sort itself.
    expect(searchReciters(index, '', 'en')).toBe(reciters);
    expect(searchReciters(index, '   ', 'en')).toBe(reciters);
  });

  it('finds a reciter when only the moshaf name matches', () => {
    const reciters = [
      makeReciter('1', 'Alif Laayyisa', 'Madani Mushaf'),
      makeReciter('2', 'Mishary Rashid', 'Qalun Mushaf'),
    ];
    const index = buildReciterSearchIndex(reciters, 'en');

    const results = searchReciters(index, 'madani', 'en');

    expect(results.map((reciter) => reciter.id)).toEqual(['1']);
  });

  it('matches an Arabic query after diacritics and letter normalization', () => {
    const reciters = [
      makeReciter('1', 'مُحَمَّد صَدِيق', 'مصحف المدينة'),
      makeReciter('2', 'أحمد بن علي', 'مصحف حفص'),
    ];
    const index = buildReciterSearchIndex(reciters, 'ar');

    // Diacritics are stripped on both sides, so a plain query matches and a
    // query that still carries diacritics matches too.
    expect(searchReciters(index, 'محمد', 'ar').map((r) => r.id)).toContain('1');
    expect(searchReciters(index, 'مُحَمَّد', 'ar').map((r) => r.id)).toContain(
      '1',
    );
    expect(searchReciters(index, 'صديق', 'ar').map((r) => r.id)).toContain('1');
    // Alif variants (أ / إ / آ) collapse to ا on both sides.
    expect(searchReciters(index, 'احمد', 'ar').map((r) => r.id)).toContain('2');
    expect(searchReciters(index, 'أحمد', 'ar').map((r) => r.id)).toContain('2');
  });
});

describe('buildReciterSearchIndex', () => {
  it('reuses the same index for the same reciters array and language', () => {
    const reciters = [makeReciter('1', 'Alif Laayyisa', 'Madani Mushaf')];

    const first = buildReciterSearchIndex(reciters, 'en');
    const second = buildReciterSearchIndex(reciters, 'en');

    expect(second).toBe(first);
  });

  it('rebuilds the index when the language or the catalog changes', () => {
    const reciters = [makeReciter('1', 'Alif Laayyisa', 'Madani Mushaf')];
    const english = buildReciterSearchIndex(reciters, 'en');

    // Language change -> different index.
    expect(buildReciterSearchIndex(reciters, 'ar')).not.toBe(english);
    // Catalog change -> different index.
    expect(
      buildReciterSearchIndex([makeReciter('2', 'Mishary')], 'en'),
    ).not.toBe(english);
  });

  it('keeps the Fuse options used by the home screen', () => {
    const index = buildReciterSearchIndex(
      [makeReciter('1', 'Alif Laayyisa', 'Madani Mushaf')],
      'en',
    );
    const options = (
      index as unknown as {
        options: {
          threshold: number;
          ignoreLocation: boolean;
          minMatchCharLength: number;
          keys: { name: string; weight: number }[];
        };
      }
    ).options;

    expect(options.threshold).toBe(0.4);
    expect(options.ignoreLocation).toBe(true);
    expect(options.minMatchCharLength).toBe(1);
    expect(options.keys).toEqual([
      { name: 'searchName', weight: 0.6 },
      { name: 'searchMoshafName', weight: 0.4 },
    ]);
  });
});
