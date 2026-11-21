import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Mp3QuranV4Adapter } from './mp3quran-v4.adapter';
import type { Mp3QuranV4Recitation } from './mp3quran-v4.types';
import { LinkSource, type Playlist, type Reciter, Riwaya } from '../../types';

const mocks = vi.hoisted(() => ({
  retryFetch: vi.fn(),
  config: { enabled: false, baseUrl: 'https://mp3quran-v4.example/v4' },
}));

vi.mock('expo-constants', () => ({
  default: { expoConfig: { slug: 'open-tarteel-tv', version: '2.0.1' } },
}));

vi.mock('./shared-fetch', () => ({ retryFetch: mocks.retryFetch }));

vi.mock('../../config/providers', () => ({
  getMp3QuranV4Config: () => ({ ...mocks.config }),
}));

const BASE = 'https://mp3quran-v4.example/v4';
const FIRST_URL = `${BASE}/recitations?locale=en`;
const SECOND_URL = `${BASE}/recitations?locale=en&page=2`;

const jsonResponse = (body: unknown): Response =>
  ({ ok: true, status: 200, json: async () => body }) as Response;

const recitation = (
  overrides: Partial<Mp3QuranV4Recitation> = {},
): Mp3QuranV4Recitation => ({
  id: 101,
  reciter: { id: 7, code: 'reciter-code', name: 'Test Reciter' },
  riwayahs: [{ code: 'hafs_an_asim', qiraah: 'Hafs', name: 'Hafs' }],
  qiraahs: [],
  code: 'recitation-code',
  tariq: null,
  wajh: null,
  style: 'Hafs',
  has_ayah_timings: true,
  coverage: { complete: true, surahs: [1, 2, 3] },
  total_duration_ms: 1000,
  audio: {
    base: 'https://audio.example/v4/',
    files: { original: 'https://audio.example/v4/original.tar' },
  },
  ...overrides,
});

const list = (
  data: Mp3QuranV4Recitation[],
  next?: string,
): { data: Mp3QuranV4Recitation[]; links?: { next?: string } } => ({
  data,
  ...(next ? { links: { next } } : {}),
});

const callGetPlaylist = (
  reciter: Reciter,
  lang: 'ar' | 'en' = 'en',
): Promise<Playlist> => {
  const getPlaylist = Mp3QuranV4Adapter.getPlaylist;
  if (!getPlaylist) throw new Error('Mp3QuranV4Adapter.getPlaylist is missing');
  return getPlaylist(reciter, lang);
};

const v4Reciter = (): Reciter => ({
  id: 'mp3quran-v4-reciter-code',
  name: 'Test Reciter',
  source: LinkSource.MP3QURAN_V4,
  moshaf: {
    id: 101,
    name: 'Hafs',
    riwaya: Riwaya.HAFS_A_ASIM,
    server: 'https://audio.example/v4/',
    surah_total: 3,
    surahIds: '1,2,3',
    playlist: [],
  },
});

describe('Mp3QuranV4Adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.config.enabled = false;
    mocks.config.baseUrl = BASE;
  });

  it('returns no reciters and makes no request while the flag is off', async () => {
    expect(await Mp3QuranV4Adapter.getReciters('ar')).toEqual([]);
    expect(mocks.retryFetch).not.toHaveBeenCalled();
  });

  it('follows links.next across pages and maps the response', async () => {
    mocks.config.enabled = true;
    mocks.retryFetch.mockImplementation((url: string) => {
      if (url === FIRST_URL) {
        return Promise.resolve(
          jsonResponse(
            list(
              [
                recitation({
                  id: 101,
                  riwayahs: [
                    { code: 'hafs_an_asim', qiraah: 'Hafs', name: 'Hafs' },
                  ],
                }),
              ],
              SECOND_URL,
            ),
          ),
        );
      }
      if (url === SECOND_URL) {
        return Promise.resolve(
          jsonResponse(
            list([
              recitation({
                id: 202,
                reciter: {
                  id: 9,
                  code: 'second-reciter',
                  name: 'Second Reciter',
                },
                riwayahs: [
                  {
                    code: 'qunbul_an_ibn_kathir',
                    qiraah: 'Qunbul',
                    name: 'Qunbul',
                  },
                ],
                has_ayah_timings: false,
              }),
            ]),
          ),
        );
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const reciters = await Mp3QuranV4Adapter.getReciters('en');

    expect(mocks.retryFetch).toHaveBeenCalledTimes(2);
    expect(mocks.retryFetch.mock.calls[0][0]).toBe(FIRST_URL);
    expect(mocks.retryFetch.mock.calls[1][0]).toBe(SECOND_URL);
    expect(reciters).toHaveLength(2);

    expect(reciters[0]).toEqual({
      id: 'mp3quran-v4-reciter-code',
      name: 'Test Reciter',
      source: LinkSource.MP3QURAN_V4,
      moshaf: {
        id: 101,
        name: 'Hafs',
        riwaya: Riwaya.HAFS_A_ASIM,
        server: 'https://audio.example/v4/',
        surah_total: 3,
        surahIds: '1,2,3',
        recitationCode: 'recitation-code',
        hasTimings: true,
        playlist: [],
      },
    });
    expect(reciters[1].moshaf.id).toBe(202);
    expect(reciters[1].moshaf.riwaya).toBe(Riwaya.AL_BAZZI_AN_IBN_KATHIR);
    expect(reciters[1].moshaf.hasTimings).toBe(false);
  });

  it('maps all 15 riwaya codes', async () => {
    mocks.config.enabled = true;
    const codes: [string, Riwaya][] = [
      ['hafs_an_asim', Riwaya.HAFS_A_ASIM],
      ['warsh_an_nafi', Riwaya.WARSH_AN_NAFI],
      ['qalun_an_nafi', Riwaya.QALUN_AN_NAFI],
      ['khalaf_an_hamzah', Riwaya.KHALAF_AN_HAMZAH],
      ['bazzi_an_ibn_kathir', Riwaya.AL_BAZZI_AN_IBN_KATHIR],
      ['qunbul_an_ibn_kathir', Riwaya.AL_BAZZI_AN_IBN_KATHIR],
      ['susi_an_abu_amr', Riwaya.AL_SOOSI_AN_ABU_AMR],
      ['duri_an_kisai', Riwaya.ALDURI_AN_ALKAISSAI],
      ['duri_an_abu_amr', Riwaya.AL_DOORI_AN_ABU_AMR],
      ['shubah_an_asim', Riwaya.SHUABA_AN_ASIM],
      ['ibn_dhakwan_an_ibn_amir', Riwaya.IBN_ZAKWAN],
      ['hisham_an_ibn_amir', Riwaya.HISHAM],
      ['ibn_jammaz_an_abu_jafar', Riwaya.IBN_JAMMAZ],
      ['rawh_an_yaqub', Riwaya.YAQOUB],
      ['ruways_an_yaqub', Riwaya.YAQOUB],
    ];

    mocks.retryFetch.mockImplementation(() =>
      Promise.resolve(
        jsonResponse(
          list(
            codes.map(([code]) =>
              recitation({
                riwayahs: [{ code, qiraah: code, name: code }],
              }),
            ),
          ),
        ),
      ),
    );

    const reciters = await Mp3QuranV4Adapter.getReciters('ar');

    expect(reciters).toHaveLength(codes.length);
    codes.forEach(([, riwaya], index) => {
      expect(reciters[index].moshaf.riwaya).toBe(riwaya);
    });
    expect(mocks.retryFetch.mock.calls[0][0]).toBe(
      `${BASE}/recitations?locale=ar`,
    );
  });

  it('defaults an unknown riwaya code to Hafs', async () => {
    mocks.config.enabled = true;
    mocks.retryFetch.mockImplementation(() =>
      Promise.resolve(
        jsonResponse(
          list([
            recitation({
              riwayahs: [{ code: 'mystery', qiraah: 'x', name: 'x' }],
            }),
          ]),
        ),
      ),
    );

    const reciters = await Mp3QuranV4Adapter.getReciters('en');

    expect(reciters[0].moshaf.riwaya).toBe(Riwaya.HAFS_A_ASIM);
  });

  it('throws when the data payload is not an array', async () => {
    mocks.config.enabled = true;
    mocks.retryFetch.mockImplementation(() =>
      Promise.resolve(jsonResponse({ data: 'not-an-array' })),
    );

    await expect(Mp3QuranV4Adapter.getReciters('en')).rejects.toThrow(
      'Unexpected MP3Quran v4 response',
    );
  });

  it('builds a playlist from surahIds and the moshaf server', async () => {
    const playlist = await callGetPlaylist(v4Reciter());

    expect(playlist).toEqual([
      { surahId: '1', link: 'https://audio.example/v4/001.mp3' },
      { surahId: '2', link: 'https://audio.example/v4/002.mp3' },
      { surahId: '3', link: 'https://audio.example/v4/003.mp3' },
    ]);
  });

  it('returns an empty playlist when surahIds is missing', async () => {
    const reciter = v4Reciter();
    delete reciter.moshaf.surahIds;

    expect(await callGetPlaylist(reciter)).toEqual([]);
  });

  it('forwards the abort signal to retryFetch', async () => {
    mocks.config.enabled = true;
    const controller = new AbortController();
    mocks.retryFetch.mockImplementation(() =>
      Promise.resolve(jsonResponse(list([]))),
    );

    await Mp3QuranV4Adapter.getReciters('en', controller.signal);

    expect(mocks.retryFetch.mock.calls[0][3]).toBe(controller.signal);
  });

  it('registers the adapter in api.ts only when the flag is enabled', async () => {
    const reciter = v4Reciter();

    mocks.config.enabled = false;
    vi.resetModules();
    const apiOff = await import('../api');
    expect(
      await apiOff.getReciterPlaylist(LinkSource.MP3QURAN_V4, reciter, 'en'),
    ).toBeNull();

    mocks.config.enabled = true;
    vi.resetModules();
    const apiOn = await import('../api');
    expect(
      await apiOn.getReciterPlaylist(LinkSource.MP3QURAN_V4, reciter, 'en'),
    ).toEqual([
      { surahId: '1', link: 'https://audio.example/v4/001.mp3' },
      { surahId: '2', link: 'https://audio.example/v4/002.mp3' },
      { surahId: '3', link: 'https://audio.example/v4/003.mp3' },
    ]);
  });
});
