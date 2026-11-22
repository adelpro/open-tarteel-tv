import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LinkSource, type Reciter, Riwaya } from '../types';
import { findReciterById } from './api';

// Vitest hoists vi.mock above imports. The reciter catalog is driven through
// the existing adapter/fetch layer (the same pattern as api.test.ts), and the
// cache is mocked at its module boundary. Both fakes must therefore be hoisted.
const fakes = vi.hoisted(() => ({
  cached: { getCachedRecitersInfo: vi.fn() },
  mp3: { source: 'mp3quran', getReciters: vi.fn() },
  itqan: { source: 'itqan', getReciters: vi.fn() },
  qurani: { source: 'qurani', getReciters: vi.fn() },
  qf: { source: 'quran-foundation', getReciters: vi.fn() },
}));

vi.mock('./reciters-cache', () => ({
  getCachedRecitersInfo: fakes.cached.getCachedRecitersInfo,
}));
vi.mock('./reciters/mp3quran.adapter', () => ({ Mp3QuranAdapter: fakes.mp3 }));
vi.mock('./reciters/itqan.adapter', () => ({ ItqanAdapter: fakes.itqan }));
vi.mock('./reciters/quranai.adapter', () => ({ QuranAiAdapter: fakes.qurani }));
vi.mock('./reciters/quranfoundation.adapter', () => ({
  QuranFoundationAdapter: fakes.qf,
}));

const makeReciter = (id: string | number, source: LinkSource): Reciter => ({
  id: id as string,
  name: `reciter-${id}`,
  source,
  moshaf: {
    id: 1,
    name: 'moshaf',
    riwaya: Riwaya.HAFS_A_ASIM,
    server: '',
    surah_total: 114,
    playlist: [],
  },
});

/** Make the fresh fetch (getAllReciters via adapters) return these reciters. */
function setFreshCatalog(reciters: Reciter[]): void {
  fakes.mp3.getReciters.mockResolvedValue(reciters);
  fakes.itqan.getReciters.mockResolvedValue([]);
  fakes.qurani.getReciters.mockResolvedValue([]);
  fakes.qf.getReciters.mockResolvedValue([]);
}

function setCachedCatalog(reciters: Reciter[] | null): void {
  fakes.cached.getCachedRecitersInfo.mockResolvedValue(
    reciters === null
      ? null
      : {
          data: reciters,
          sources: {},
          sourcesKey: '',
          timestamp: Date.now(),
        },
  );
}

describe('findReciterById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setCachedCatalog(null);
    setFreshCatalog([]);
  });

  it('returns a cached reciter without a fresh fetch', async () => {
    const cached = makeReciter('42', LinkSource.MP3QURAN);
    setCachedCatalog([cached]);
    setFreshCatalog([makeReciter('42', LinkSource.ITQAN)]);

    await expect(findReciterById('42', 'ar')).resolves.toBe(cached);
    expect(fakes.cached.getCachedRecitersInfo).toHaveBeenCalledWith('ar');
    // No fresh fetch: none of the adapters should have been hit.
    expect(fakes.mp3.getReciters).not.toHaveBeenCalled();
    expect(fakes.itqan.getReciters).not.toHaveBeenCalled();
    expect(fakes.qurani.getReciters).not.toHaveBeenCalled();
    expect(fakes.qf.getReciters).not.toHaveBeenCalled();
  });

  it('falls back to a fresh fetch and finds a reciter missing from the cache', async () => {
    setCachedCatalog([makeReciter('1', LinkSource.MP3QURAN)]);
    const fetched = makeReciter('42', LinkSource.MP3QURAN);
    setFreshCatalog([fetched]);

    await expect(findReciterById('42', 'ar')).resolves.toBe(fetched);
    expect(fakes.cached.getCachedRecitersInfo).toHaveBeenCalledWith('ar');
    expect(fakes.mp3.getReciters).toHaveBeenCalled();
  });

  it('returns null for a bogus id', async () => {
    setCachedCatalog([makeReciter('1', LinkSource.MP3QURAN)]);
    setFreshCatalog([makeReciter('2', LinkSource.MP3QURAN)]);

    await expect(findReciterById('999', 'ar')).resolves.toBeNull();
  });

  it('matches numeric and string ids via String comparison', async () => {
    const numericReciter = makeReciter(42, LinkSource.MP3QURAN);
    setCachedCatalog([numericReciter]);

    await expect(findReciterById(42, 'ar')).resolves.toBe(numericReciter);
    await expect(findReciterById('42', 'ar')).resolves.toBe(numericReciter);
    expect(fakes.mp3.getReciters).not.toHaveBeenCalled();
  });
});
