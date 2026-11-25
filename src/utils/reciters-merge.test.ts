import { describe, expect, it } from 'vitest';

import type { ReciterSourceResult } from '../services/api';
import { LinkSource, type Reciter, Riwaya } from '../types';
import { mergeRecitersBySource } from './reciters-merge';

function makeReciter(id: string, name: string): Reciter {
  return {
    id,
    name,
    source: LinkSource.MP3QURAN,
    moshaf: {
      id: 1,
      name: 'Moshaf',
      riwaya: Riwaya.HAFS_A_ASIM,
      server: 'https://example.test',
      surah_total: 114,
      playlist: [],
    },
  };
}

describe('mergeRecitersBySource', () => {
  it('replaces the cached list when a source returns reciters', () => {
    const fresh = [makeReciter('1', 'Fresh')];
    const cached = [makeReciter('9', 'Cached')];

    const { mergedSources, merged } = mergeRecitersBySource(
      [{ source: 'mp3quran', reciters: fresh }],
      { mp3quran: cached },
    );

    expect(mergedSources.mp3quran).toEqual(fresh);
    expect(merged).toEqual(fresh);
  });

  it('keeps the cached list when a source returns nothing', () => {
    const cached = [makeReciter('9', 'Cached')];

    const { mergedSources, merged } = mergeRecitersBySource(
      [{ source: 'mp3quran', reciters: [] }],
      { mp3quran: cached },
    );

    expect(mergedSources.mp3quran).toEqual(cached);
    expect(merged).toEqual(cached);
  });

  it('drops sources that were not fetched', () => {
    const fetched = makeReciter('1', 'Fresh');

    const { mergedSources, merged } = mergeRecitersBySource(
      [{ source: 'mp3quran', reciters: [fetched] }],
      { itqan: [makeReciter('2', 'Other')] },
    );

    expect(Object.keys(mergedSources)).toEqual(['mp3quran']);
    expect(mergedSources.itqan).toBeUndefined();
    expect(merged).toEqual([fetched]);
  });

  it('flattens every merged source into one list', () => {
    const first = makeReciter('1', 'First');
    const second = makeReciter('2', 'Second');
    const third = makeReciter('3', 'Third');

    const { mergedSources, merged } = mergeRecitersBySource(
      [
        { source: 'mp3quran', reciters: [first, second] },
        { source: 'itqan', reciters: [third] },
      ],
      {},
    );

    expect(mergedSources).toEqual({
      mp3quran: [first, second],
      itqan: [third],
    });
    expect(merged).toEqual(Object.values(mergedSources).flat());
    expect(merged).toEqual([first, second, third]);
  });

  it('returns empty results when no source was fetched', () => {
    expect(mergeRecitersBySource([], {})).toEqual({
      mergedSources: {},
      merged: [],
    });
  });

  it('keeps a failed source with nothing cached as an empty list', () => {
    const failed: ReciterSourceResult[] = [
      { source: 'mp3quran', reciters: [], error: 'offline' },
    ];

    const { mergedSources, merged } = mergeRecitersBySource(failed, {});

    expect(mergedSources.mp3quran).toEqual([]);
    expect(merged).toEqual([]);
  });
});
