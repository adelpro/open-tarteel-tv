import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LinkSource, type Reciter, Riwaya } from '../types';
import { fetchRecitersBySource, getSourceErrorCount } from './api';

// Mock the transport and cache layers so fetchRecitersBySource exercises the
// real Itqan adapter without any network or AsyncStorage side effects.
const mocks = vi.hoisted(() => ({ retryFetch: vi.fn() }));

vi.mock('expo-constants', () => ({
  default: { expoConfig: { slug: 'open-tarteel-tv', version: '2.0.1' } },
}));

vi.mock('./reciters/shared-fetch', () => ({ retryFetch: mocks.retryFetch }));

vi.mock('./reciters/itqan-playlist-cache', () => ({
  getCachedItqanPlaylist: vi.fn().mockResolvedValue(null),
  setCachedItqanPlaylist: vi.fn().mockResolvedValue(undefined),
}));

const jsonResponse = (body: unknown): Response =>
  ({ ok: true, status: 200, json: async () => body }) as Response;

const recitation = (id: number, reciterId: number) => ({
  id,
  name: 'Hafs',
  description: '',
  publisher: { id: 1, name: 'Publisher' },
  reciter: { id: reciterId, name: 'Reciter' },
  riwayah: { id: 1, name: 'Hafs' },
  surahs_count: 114,
});

const makeReciter = (): Reciter => ({
  id: 'mp3quran-1',
  name: 'Reciter',
  source: LinkSource.MP3QURAN,
  moshaf: {
    id: 1,
    name: 'Hafs',
    riwaya: Riwaya.HAFS_A_ASIM,
    server: '',
    surah_total: 114,
    playlist: [],
  },
});

// Only Itqan is active, so a source-level failure is unambiguously its own.
const ONLY_ITQAN: Record<string, boolean> = {
  mp3quran: false,
  itqan: true,
  qurani: false,
  'quran-foundation': false,
  'mp3quran-v4': false,
};

describe('getSourceErrorCount', () => {
  it('counts one failing source among clean ones', () => {
    expect(
      getSourceErrorCount([
        { source: LinkSource.MP3QURAN, reciters: [makeReciter()] },
        { source: LinkSource.ITQAN, reciters: [], error: 'Itqan is down' },
      ]),
    ).toBe(1);
  });

  it('returns zero when every source is clean', () => {
    expect(
      getSourceErrorCount([
        { source: LinkSource.MP3QURAN, reciters: [makeReciter()] },
        { source: LinkSource.ITQAN, reciters: [makeReciter()] },
      ]),
    ).toBe(0);
  });

  it('does not count a source with zero reciters and no error', () => {
    expect(
      getSourceErrorCount([{ source: LinkSource.QURANAI, reciters: [] }]),
    ).toBe(0);
  });
});

describe('Itqan source-level failures reach the result', () => {
  beforeEach(() => {
    mocks.retryFetch.mockReset();
    mocks.retryFetch.mockImplementation((url: string) => {
      if (url.includes('/recitations/?')) {
        return Promise.resolve(jsonResponse({ count: 0, results: [] }));
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });
  });

  it('records a network failure as an error instead of an empty catalog', async () => {
    mocks.retryFetch.mockRejectedValue(new Error('Itqan network down'));

    const results = await fetchRecitersBySource('en', ONLY_ITQAN);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      source: LinkSource.ITQAN,
      reciters: [],
      error: 'Itqan network down',
    });
    expect(getSourceErrorCount(results)).toBe(1);
  });

  it('does not count an aborted Itqan fetch as a source error', async () => {
    mocks.retryFetch.mockRejectedValue(
      Object.assign(new Error('aborted'), { name: 'AbortError' }),
    );

    const results = await fetchRecitersBySource('en', ONLY_ITQAN);

    expect(results[0].error).toBeUndefined();
    expect(getSourceErrorCount(results)).toBe(0);
  });

  it('records an HTTP failure as an error', async () => {
    mocks.retryFetch.mockResolvedValue({ ok: false, status: 503 } as Response);

    const results = await fetchRecitersBySource('en', ONLY_ITQAN);

    expect(results[0].error).toContain('HTTP 503');
    expect(getSourceErrorCount(results)).toBe(1);
  });

  it('skips a malformed recitation without failing the source', async () => {
    const broken = {
      ...recitation(12, 8),
      reciter: undefined as unknown as { id: number; name: string },
    };
    mocks.retryFetch.mockImplementation((url: string) => {
      if (url.includes('/recitations/?')) {
        return Promise.resolve(
          jsonResponse({ count: 2, results: [recitation(11, 7), broken] }),
        );
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const results = await fetchRecitersBySource('en', ONLY_ITQAN);

    expect(results[0].error).toBeUndefined();
    expect(results[0].reciters).toHaveLength(1);
    expect(results[0].reciters[0].id).toBe('itqan-7-11');
    expect(getSourceErrorCount(results)).toBe(0);
  });
});
