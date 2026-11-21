import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ItqanAdapter } from './itqan.adapter';
import type {
  ItqanRecitationDetailResponse,
  ItqanRecitationResponse,
  ItqanReciterResponse,
  ItqanSurah,
} from './itqan.types';
import { LinkSource, type Playlist, type Reciter, Riwaya } from '../../types';

const mocks = vi.hoisted(() => ({
  retryFetch: vi.fn(),
  getCached: vi.fn(),
  setCached: vi.fn(),
  config: { apiKey: undefined as string | undefined },
}));

vi.mock('expo-constants', () => ({
  default: { expoConfig: { slug: 'open-tarteel-tv', version: '2.0.1' } },
}));

vi.mock('./shared-fetch', () => ({ retryFetch: mocks.retryFetch }));

vi.mock('../../config/providers', () => ({
  getItqanConfig: () => ({
    baseUrl: 'https://itqan.example',
    ...(mocks.config.apiKey ? { apiKey: mocks.config.apiKey } : {}),
  }),
}));

vi.mock('./itqan-playlist-cache', () => ({
  getCachedItqanPlaylist: mocks.getCached,
  setCachedItqanPlaylist: mocks.setCached,
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

const surah = (surahNumber: number): ItqanSurah => ({
  surah_number: surahNumber,
  surah_name: 'الفاتحة',
  surah_name_en: 'Al-Fatihah',
  audio_url: `https://audio.example/${surahNumber}.mp3`,
  duration_ms: 1000,
  size_bytes: 1000,
  revelation_order: surahNumber,
  revelation_place: 'Mecca',
  ayahs_count: 7,
  ayahs_timings: [],
});

const emptyRecitations: ItqanRecitationResponse = { count: 0, results: [] };
const emptyReciters: ItqanReciterResponse = { count: 0, results: [] };
const emptyDetail: ItqanRecitationDetailResponse = { count: 0, results: [] };

const setApiResponses = ({
  recitations = emptyRecitations,
  reciters = emptyReciters,
  detail = emptyDetail,
}: {
  recitations?: ItqanRecitationResponse;
  reciters?: ItqanReciterResponse;
  detail?: ItqanRecitationDetailResponse;
} = {}) => {
  mocks.retryFetch.mockImplementation((url: string) => {
    if (url.includes('/recitations/?')) {
      return Promise.resolve(jsonResponse(recitations));
    }
    if (url.includes('/reciters/?')) {
      return Promise.resolve(jsonResponse(reciters));
    }
    if (url.includes('/recitations/')) {
      return Promise.resolve(jsonResponse(detail));
    }
    return Promise.reject(new Error(`Unexpected URL: ${url}`));
  });
};

const makeItqanReciter = (): Reciter => ({
  id: 'itqan-7-11',
  name: 'Reciter',
  source: LinkSource.ITQAN,
  moshaf: {
    id: 11,
    name: 'Hafs',
    riwaya: Riwaya.HAFS_A_ASIM,
    server: '',
    surah_total: 114,
    playlist: [],
  },
});

const headersOfCall = (index: number): Record<string, string> =>
  mocks.retryFetch.mock.calls[index][2] as Record<string, string>;

const callGetPlaylist = (
  reciter: Reciter,
  lang: 'ar' | 'en',
  signal?: AbortSignal,
): Promise<Playlist> => {
  const getPlaylist = ItqanAdapter.getPlaylist;
  if (!getPlaylist) throw new Error('ItqanAdapter.getPlaylist is missing');
  return getPlaylist(reciter, lang, signal);
};

describe('ItqanAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.config.apiKey = undefined;
    mocks.getCached.mockResolvedValue(null);
    mocks.setCached.mockResolvedValue(undefined);
    setApiResponses();
  });

  afterEach(() => {
    mocks.config.apiKey = undefined;
  });

  it('sends Accept-Language and client headers, but no API key when unconfigured', async () => {
    setApiResponses({
      recitations: { count: 1, results: [recitation(11, 7)] },
    });

    const reciters = await ItqanAdapter.getReciters('ar');

    expect(reciters).toHaveLength(1);
    expect(mocks.retryFetch.mock.calls[0][0]).toBe(
      'https://itqan.example/recitations/?page_size=1000',
    );
    expect(headersOfCall(0)).toMatchObject({
      'Accept-Language': 'ar',
      'X-Client-Name': 'open-tarteel-tv',
      'X-Client-Version': '2.0.1',
    });
    expect(headersOfCall(0)).not.toHaveProperty('X-API-Key');
  });

  it('sends X-API-Key only when the config supplies one', async () => {
    mocks.config.apiKey = 'test-api-key';
    setApiResponses({ recitations: { count: 0, results: [] } });

    await ItqanAdapter.getReciters('en');

    expect(headersOfCall(0)['X-API-Key']).toBe('test-api-key');
    expect(headersOfCall(0)['Accept-Language']).toBe('en');
  });

  it('skips a malformed recitation instead of dropping the whole source', async () => {
    const broken = {
      ...recitation(12, 8),
      reciter: undefined as unknown as { id: number; name: string },
    };
    setApiResponses({
      recitations: { count: 2, results: [recitation(11, 7), broken] },
    });

    const reciters = await ItqanAdapter.getReciters('en');

    expect(reciters).toHaveLength(1);
    expect(reciters[0].id).toBe('itqan-7-11');
  });

  it('throws on an HTTP error from the recitations endpoint', async () => {
    mocks.retryFetch.mockResolvedValue({ ok: false, status: 503 } as Response);

    await expect(ItqanAdapter.getReciters('en')).rejects.toThrow('HTTP 503');
  });

  it('throws on a malformed recitations payload', async () => {
    setApiResponses({
      recitations: { count: 0 } as unknown as ItqanRecitationResponse,
    });

    await expect(ItqanAdapter.getReciters('en')).rejects.toThrow(
      'Invalid Itqan recitations payload',
    );
  });

  it('keys the playlist cache by reciter.id and skips malformed surahs', async () => {
    const reciter = makeItqanReciter();
    setApiResponses({
      detail: {
        count: 3,
        results: [surah(1), { ...surah(2), audio_url: '' }, surah(3)],
      },
    });

    const playlist = await callGetPlaylist(reciter, 'ar');

    expect(playlist).toEqual([
      { surahId: '1', link: 'https://audio.example/1.mp3' },
      { surahId: '3', link: 'https://audio.example/3.mp3' },
    ]);
    expect(mocks.getCached).toHaveBeenCalledWith(reciter.id);
    expect(mocks.setCached).toHaveBeenCalledWith(reciter.id, playlist);
    expect(mocks.retryFetch.mock.calls[0][0]).toBe(
      'https://itqan.example/recitations/11?page_size=1000',
    );
    expect(headersOfCall(0)).toMatchObject({
      'Accept-Language': 'ar',
      'X-Client-Name': 'open-tarteel-tv',
      'X-Client-Version': '2.0.1',
    });
  });

  it('returns the cached playlist without a network call', async () => {
    const cached: Playlist = [
      { surahId: '1', link: 'https://audio.example/cached.mp3' },
    ];
    mocks.getCached.mockResolvedValue(cached);

    expect(await callGetPlaylist(makeItqanReciter(), 'ar')).toBe(cached);
    expect(mocks.retryFetch).not.toHaveBeenCalled();
  });

  it('treats an empty cached playlist as a miss and refetches', async () => {
    const reciter = makeItqanReciter();
    const fresh: Playlist = [
      { surahId: '1', link: 'https://audio.example/1.mp3' },
    ];
    mocks.getCached.mockResolvedValue([]);
    setApiResponses({ detail: { count: 1, results: [surah(1)] } });

    expect(await callGetPlaylist(reciter, 'en')).toEqual(fresh);
    expect(mocks.retryFetch).toHaveBeenCalledTimes(1);
    expect(mocks.setCached).toHaveBeenCalledWith(reciter.id, fresh);
  });

  it('forwards the abort signal and does not retry an aborted request itself', async () => {
    const controller = new AbortController();
    controller.abort();
    mocks.retryFetch.mockRejectedValue(new Error('aborted'));

    await expect(
      callGetPlaylist(makeItqanReciter(), 'ar', controller.signal),
    ).rejects.toThrow('aborted');

    expect(mocks.retryFetch).toHaveBeenCalledTimes(1);
    expect(mocks.retryFetch.mock.calls[0][3]).toBe(controller.signal);
  });
});
