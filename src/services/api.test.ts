import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LinkSource, type Playlist, type Reciter, Riwaya } from '../types';
import { fetchRecitersBySource, getReciterPlaylist } from './api';

// Fake the registered adapters at module scope; Vitest hoists vi.mock
// above the imports, so api.ts builds RECITER_SOURCES from these objects.
const fakes = vi.hoisted(() => ({
  mp3: { source: 'mp3quran', getReciters: vi.fn() },
  itqan: {
    source: 'itqan',
    getReciters: vi.fn(),
    getPlaylist: vi.fn(),
  },
  qf: {
    source: 'quran-foundation',
    getReciters: vi.fn(),
    getPlaylist: vi.fn(),
  },
}));

vi.mock('./reciters/mp3quran.adapter', () => ({ Mp3QuranAdapter: fakes.mp3 }));
vi.mock('./reciters/itqan.adapter', () => ({ ItqanAdapter: fakes.itqan }));
vi.mock('./reciters/quranai.adapter', () => ({
  QuranAiAdapter: { source: 'qurani', getReciters: vi.fn() },
}));
vi.mock('./reciters/quranfoundation.adapter', () => ({
  QuranFoundationAdapter: fakes.qf,
}));

const makeReciter = (id: string, source: LinkSource): Reciter => ({
  id,
  name: id,
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

const PLAYLIST: Playlist = [
  { surahId: '1', link: 'https://audio.example/1.mp3' },
];

describe('fetchRecitersBySource', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fakes.mp3.getReciters.mockResolvedValue([
      makeReciter('mp3-1', LinkSource.MP3QURAN),
    ]);
    fakes.itqan.getReciters.mockRejectedValue(new Error('Itqan is down'));
    fakes.itqan.getPlaylist.mockResolvedValue(PLAYLIST);
  });

  it('records a failing source error while keeping the other source intact', async () => {
    const results = await fetchRecitersBySource('ar', {
      mp3quran: true,
      itqan: true,
      qurani: false,
      'quran-foundation': false,
    });

    expect(results).toHaveLength(2);

    const mp3 = results.find((r) => r.source === LinkSource.MP3QURAN);
    const itqan = results.find((r) => r.source === LinkSource.ITQAN);

    expect(mp3?.reciters).toHaveLength(1);
    expect(mp3?.error).toBeUndefined();

    expect(itqan?.reciters).toEqual([]);
    expect(itqan?.error).toBe('Itqan is down');
  });
});

describe('getReciterPlaylist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fakes.itqan.getPlaylist.mockResolvedValue(PLAYLIST);
  });

  it("returns the adapter's playlist and forwards lang and signal", async () => {
    const reciter = makeReciter('itqan-1', LinkSource.ITQAN);
    const controller = new AbortController();

    const playlist = await getReciterPlaylist(
      LinkSource.ITQAN,
      reciter,
      'ar',
      controller.signal,
    );

    expect(playlist).toEqual(PLAYLIST);
    expect(fakes.itqan.getPlaylist).toHaveBeenCalledWith(
      reciter,
      'ar',
      controller.signal,
    );
  });

  it('returns null for a source without getPlaylist', async () => {
    const reciter = makeReciter('mp3-1', LinkSource.MP3QURAN);

    expect(
      await getReciterPlaylist(LinkSource.MP3QURAN, reciter, 'en'),
    ).toBeNull();
    expect(fakes.itqan.getPlaylist).not.toHaveBeenCalled();
  });
});
