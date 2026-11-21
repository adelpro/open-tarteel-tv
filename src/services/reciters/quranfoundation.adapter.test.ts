import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  QuranFoundationAdapter,
  resetQuranFoundationCache,
} from './quranfoundation.adapter';
import { LinkSource, Riwaya } from '../../types';

const mocks = vi.hoisted(() => ({
  qfFetch: vi.fn(),
  resetClientCache: vi.fn(),
}));

vi.mock('./quran-foundation.client', () => ({
  qfFetch: mocks.qfFetch,
  resetQuranFoundationClientCache: mocks.resetClientCache,
}));

const jsonResponse = (body: unknown): Response =>
  ({ ok: true, status: 200, json: async () => body }) as Response;

const chapterReciter = (overrides: Record<string, unknown> = {}) => ({
  id: 42,
  name: 'Latin Name',
  translated_name: { name: 'Arabic Name' },
  qirat: { name: 'Hafs' },
  ...overrides,
});

const listResponse = (reciters: unknown[]) => jsonResponse({ reciters });

const getReciters = (lang: 'ar' | 'en' = 'ar') =>
  QuranFoundationAdapter.getReciters(lang);

const getPlaylistOf = (id: number) => {
  const getPlaylist = QuranFoundationAdapter.getPlaylist;
  if (!getPlaylist)
    throw new Error('QuranFoundationAdapter.getPlaylist missing');
  return getPlaylist(
    {
      id: `quran-foundation-${id}`,
      name: 'Reciter',
      source: LinkSource.QURAN_FOUNDATION,
      moshaf: {
        id,
        name: 'Hafs',
        riwaya: Riwaya.HAFS_A_ASIM,
        server: '',
        surah_total: 114,
        playlist: [],
      },
    },
    'ar',
  );
};

describe('QuranFoundationAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetQuranFoundationCache();
    // Clear the reset spy so each test only counts its own explicit resets.
    mocks.resetClientCache.mockClear();
    mocks.qfFetch.mockResolvedValue(jsonResponse({ reciters: [] }));
  });

  it('prefers translated_name.name and falls back to name for the reciter name', async () => {
    mocks.qfFetch.mockResolvedValue(
      listResponse([
        chapterReciter(),
        chapterReciter({
          id: 7,
          translated_name: null,
          name: 'Fallback Name',
        }),
      ]),
    );

    const reciters = await getReciters('ar');

    expect(reciters).toHaveLength(2);
    expect(reciters[0].name).toBe('Arabic Name');
    expect(reciters[1].name).toBe('Fallback Name');
    expect(mocks.qfFetch).toHaveBeenCalledWith(
      '/content/api/v4/resources/chapter_reciters?language=ar',
      expect.anything(),
    );
  });

  it('uses the numeric API id as moshaf.id and maps riwaya from qirat.name', async () => {
    mocks.qfFetch.mockResolvedValue(
      listResponse([chapterReciter({ id: 99, qirat: { name: 'Warsh' } })]),
    );

    const reciters = await getReciters('en');

    expect(reciters[0].id).toBe('quran-foundation-99');
    expect(reciters[0].source).toBe(LinkSource.QURAN_FOUNDATION);
    expect(reciters[0].moshaf.id).toBe(99);
    expect(typeof reciters[0].moshaf.id).toBe('number');
    expect(reciters[0].moshaf.riwaya).toBe(Riwaya.WARSH_AN_NAFI);
  });

  it('skips a reciter with no name', async () => {
    mocks.qfFetch.mockResolvedValue(
      listResponse([
        chapterReciter({ id: 1, translated_name: null, name: '' }),
        chapterReciter({ id: 2 }),
      ]),
    );

    const reciters = await getReciters('ar');

    expect(reciters).toHaveLength(1);
    expect(reciters[0].moshaf.id).toBe(2);
  });

  it('returns a playlist sorted by chapter_id', async () => {
    mocks.qfFetch.mockResolvedValue(
      jsonResponse({
        audio_files: [
          { chapter_id: 3, audio_url: 'https://audio.example/3.mp3' },
          { chapter_id: 1, audio_url: 'https://audio.example/1.mp3' },
          { chapter_id: 2, audio_url: 'https://audio.example/2.mp3' },
        ],
      }),
    );

    const playlist = await getPlaylistOf(42);

    expect(playlist).toEqual([
      { surahId: '1', link: 'https://audio.example/1.mp3' },
      { surahId: '2', link: 'https://audio.example/2.mp3' },
      { surahId: '3', link: 'https://audio.example/3.mp3' },
    ]);
    expect(mocks.qfFetch).toHaveBeenCalledWith(
      '/content/api/v4/chapter_recitations/42',
      expect.anything(),
    );
  });

  it('resetQuranFoundationCache clears the results cache and the token cache', async () => {
    mocks.qfFetch
      .mockResolvedValueOnce(
        listResponse([
          chapterReciter({ id: 1, translated_name: { name: 'First' } }),
        ]),
      )
      .mockResolvedValueOnce(
        listResponse([
          chapterReciter({ id: 2, translated_name: { name: 'Second' } }),
        ]),
      );

    expect((await getReciters('ar'))[0].name).toBe('First');
    expect((await getReciters('ar'))[0].name).toBe('First');
    expect(mocks.qfFetch).toHaveBeenCalledTimes(1); // cached

    resetQuranFoundationCache();

    expect((await getReciters('ar'))[0].name).toBe('Second');
    expect(mocks.qfFetch).toHaveBeenCalledTimes(2);
    expect(mocks.resetClientCache).toHaveBeenCalledTimes(1);
  });
});
