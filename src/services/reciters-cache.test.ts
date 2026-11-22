import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LinkSource, type Reciter, Riwaya } from '../types';
import {
  chunkReciters,
  clearRecitersCache,
  getCachedReciters,
  getCachedRecitersInfo,
  getRecitersCacheTimestamp,
  setCachedReciters,
} from './reciters-cache';

const LEGACY_KEY = '@open_tarteel_reciters_cache';
const INDEX_KEY = '@open_tarteel_reciters_index';
const CHUNK_PREFIX = '@open_tarteel_reciters_chunk/';

// AsyncStorage is mocked at the module boundary with an in-memory map. vi.hoisted
// keeps both the map and the mock available inside the hoisted vi.mock factory.
const { storage, asyncStorage } = vi.hoisted(() => {
  const storage = new Map<string, string>();
  const asyncStorage = {
    getItem: vi.fn(async (key: string) => storage.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      storage.set(key, value);
    }),
    removeItem: vi.fn(async (key: string) => {
      storage.delete(key);
    }),
  };
  return { storage, asyncStorage };
});

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: asyncStorage,
}));

function makeReciters(
  count: number,
  source: LinkSource = LinkSource.MP3QURAN,
): Reciter[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `r-${i}`,
    name: `reciter-${i}`,
    source,
    moshaf: {
      id: 1,
      name: 'moshaf',
      riwaya: Riwaya.HAFS_A_ASIM,
      server: '',
      surah_total: 114,
      playlist: [],
    },
  }));
}

function chunkKeys(): string[] {
  return [...storage.keys()]
    .filter((key) => key.startsWith(CHUNK_PREFIX))
    .sort();
}

describe('chunkReciters', () => {
  it('splits 120 reciters into three bounded chunks with the default size of 50', () => {
    const chunks = chunkReciters(makeReciters(120));

    expect(chunks).toHaveLength(3);
    expect(chunks.map((chunk) => chunk.length)).toEqual([50, 50, 20]);
    expect(chunks[0][0].name).toBe('reciter-0');
    expect(chunks[1][0].name).toBe('reciter-50');
    expect(chunks[2][19].name).toBe('reciter-119');
  });

  it('honors an explicit size and returns no chunks for an empty list', () => {
    expect(chunkReciters(makeReciters(5), 2).map((c) => c.length)).toEqual([
      2, 2, 1,
    ]);
    expect(chunkReciters([])).toEqual([]);
  });
});

describe('chunked reciter cache', () => {
  beforeEach(() => {
    storage.clear();
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('round-trips data, sources, sourcesKey, timestamp and lang', async () => {
    const ar = makeReciters(120, LinkSource.MP3QURAN);
    const en = makeReciters(3, LinkSource.ITQAN);
    const sources = { mp3quran: ar, itqan: en };

    await setCachedReciters(sources, 'ar');

    const info = await getCachedRecitersInfo('ar');
    expect(info).not.toBeNull();
    expect(info?.data).toEqual([...ar, ...en]);
    expect(info?.sources).toEqual(sources);
    expect(info?.sourcesKey).toBe('itqan|mp3quran');
    expect(info?.timestamp).toBe(Date.now());

    // lang is round-tripped through the index even though it is not part of the
    // public CachedRecitersInfo shape that HomeScreen consumes.
    expect(await getCachedRecitersInfo('en')).toBeNull();
    expect(await getCachedReciters('ar')).toEqual([...ar, ...en]);
  });

  it('stores no single value containing the whole catalog', async () => {
    const reciters = makeReciters(120);
    await setCachedReciters({ mp3quran: reciters }, 'ar');

    expect(chunkKeys()).toEqual([
      `${CHUNK_PREFIX}mp3quran/0`,
      `${CHUNK_PREFIX}mp3quran/1`,
      `${CHUNK_PREFIX}mp3quran/2`,
    ]);

    const names = reciters.map((r) => r.name);
    for (const value of storage.values()) {
      // No stored row embeds all 120 reciters — the CursorWindow fix.
      expect(names.every((name) => value.includes(name))).toBe(false);
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        expect(parsed.length).toBeLessThanOrEqual(50);
      } else {
        expect(parsed).not.toHaveProperty('data');
        expect(parsed).not.toHaveProperty('sources');
      }
    }
  });

  it('never reads the legacy key and removes it on write', async () => {
    storage.set(
      LEGACY_KEY,
      JSON.stringify({ data: 'x'.repeat(2 * 1024 * 1024) }),
    );

    await setCachedReciters({ mp3quran: makeReciters(10) }, 'ar');
    await getCachedRecitersInfo('ar');

    expect(asyncStorage.getItem).not.toHaveBeenCalledWith(LEGACY_KEY);
    expect(storage.has(LEGACY_KEY)).toBe(false);
  });

  it('ignores a legacy-only cache and removes the legacy key on clear', async () => {
    storage.set(
      LEGACY_KEY,
      JSON.stringify({
        data: makeReciters(120),
        sources: {},
        sourcesKey: '',
        timestamp: Date.now(),
        lang: 'ar',
      }),
    );

    expect(await getCachedRecitersInfo('ar')).toBeNull();
    expect(await getRecitersCacheTimestamp()).toBeNull();

    await clearRecitersCache();
    expect(storage.has(LEGACY_KEY)).toBe(false);
    expect(asyncStorage.getItem).not.toHaveBeenCalledWith(LEGACY_KEY);
  });

  it('clears the index and every chunk', async () => {
    await setCachedReciters(
      { mp3quran: makeReciters(120), itqan: makeReciters(60) },
      'ar',
    );
    expect(storage.has(INDEX_KEY)).toBe(true);
    expect(chunkKeys()).toHaveLength(5);

    await clearRecitersCache();

    expect(storage.size).toBe(0);
  });

  it('returns null for a cache older than three days', async () => {
    await setCachedReciters({ mp3quran: makeReciters(10) }, 'ar');
    const writtenAt = await getRecitersCacheTimestamp();
    expect(writtenAt).toBe(Date.now());

    vi.setSystemTime(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 1));

    expect(await getCachedRecitersInfo('ar')).toBeNull();
    expect(await getCachedReciters('ar')).toBeNull();
    // Timestamp remains readable regardless of freshness (unchanged behavior).
    expect(await getRecitersCacheTimestamp()).toBe(writtenAt);
  });

  it('serves a cache exactly at the three-day boundary', async () => {
    await setCachedReciters({ mp3quran: makeReciters(10) }, 'ar');
    vi.setSystemTime(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000));

    expect(await getCachedRecitersInfo('ar')).not.toBeNull();
  });

  it('treats a missing chunk as a cache miss', async () => {
    await setCachedReciters({ mp3quran: makeReciters(120) }, 'ar');
    storage.delete(`${CHUNK_PREFIX}mp3quran/1`);

    expect(await getCachedRecitersInfo('ar')).toBeNull();
  });

  it('removes chunks left over from a larger previous catalog on rewrite', async () => {
    await setCachedReciters({ mp3quran: makeReciters(120) }, 'ar');
    expect(chunkKeys()).toHaveLength(3);

    await setCachedReciters({ mp3quran: makeReciters(10) }, 'ar');

    expect(chunkKeys()).toEqual([`${CHUNK_PREFIX}mp3quran/0`]);
    expect((await getCachedRecitersInfo('ar'))?.data).toHaveLength(10);
  });

  it('round-trips an empty catalog', async () => {
    await setCachedReciters({}, 'ar');

    expect(await getCachedRecitersInfo('ar')).toEqual({
      data: [],
      sources: {},
      sourcesKey: '',
      timestamp: Date.now(),
    });
  });
});
