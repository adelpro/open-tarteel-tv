import { beforeEach, describe, expect, it, vi } from 'vitest';

import editionBases from './quranai-bases.json';
import { QuranAiAdapter } from './quranai.adapter';
import { LinkSource, type Playlist, type Reciter, Riwaya } from '../../types';

const mocks = vi.hoisted(() => ({
  retryFetch: vi.fn(),
}));

vi.mock('./shared-fetch', () => ({ retryFetch: mocks.retryFetch }));

vi.mock('../../config/providers', () => ({
  getQuranAiConfig: () => ({ baseUrl: 'https://qurani.example/gw/qh/v1' }),
}));

const BASE_URL = 'https://qurani.example/gw/qh/v1';
const EDITION_ID = 'ar.testreciter.hafs';
const SILENT_ID = 'ar.silent.hafs';
const PROBED_BASE = 'https://cdn.example/audio/ar.testreciter.hafs/';

const jsonResponse = (body: unknown): Response =>
  ({ ok: true, status: 200, json: async () => body }) as Response;

const edition = (overrides: Record<string, unknown> = {}) => ({
  identifier: EDITION_ID,
  language: 'ar',
  name: 'Test Reciter',
  englishName: 'Test Reciter EN',
  format: 'audio',
  type: 'surah',
  direction: null,
  narratorIdentifier: 'quran-hafs',
  ...overrides,
});

// FNV-1a 32-bit forced unsigned — the id strategy the adapter must use.
const fnv1a = (input: string): number => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

const mockApi = ({
  editions,
  probeAudio,
}: {
  editions: unknown[];
  probeAudio: Record<string, string | undefined>;
}) => {
  mocks.retryFetch.mockImplementation((url: string) => {
    if (url === `${BASE_URL}/edition/?format=audio`) {
      return Promise.resolve(
        jsonResponse({ code: 200, status: 'ok', data: editions }),
      );
    }
    if (url.startsWith(`${BASE_URL}/surah/`)) {
      const match = url.match(/\/surah\/\d+\/(.+?)(?:\?|$)/);
      const identifier = match ? decodeURIComponent(match[1]) : '';
      return Promise.resolve(
        jsonResponse({
          code: 200,
          status: 'ok',
          data: {
            number: 1,
            numberOfAyahs: 7,
            audio: probeAudio[identifier] ?? '',
            ayahs: [],
            edition: { identifier, type: 'surah' },
          },
        }),
      );
    }
    return Promise.reject(new Error(`Unexpected URL: ${url}`));
  });
};

const getPlaylistOf = (reciter: Reciter): Promise<Playlist> => {
  const getPlaylist = QuranAiAdapter.getPlaylist;
  if (!getPlaylist) throw new Error('QuranAiAdapter.getPlaylist is missing');
  return getPlaylist(reciter, 'ar');
};

describe('QuranAiAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi({
      editions: [
        edition(),
        edition({ identifier: 'ar.ayah.edition', type: 'ayah' }),
      ],
      probeAudio: { [EDITION_ID]: `${PROBED_BASE}1.mp3` },
    });
  });

  it('maps only surah editions with playable audio to reciters', async () => {
    const reciters = await QuranAiAdapter.getReciters('ar');

    expect(reciters).toHaveLength(1);
    const reciter = reciters[0];
    expect(reciter.id).toBe(`${LinkSource.QURANAI}-${EDITION_ID}`);
    expect(reciter.name).toBe('Test Reciter');
    expect(reciter.source).toBe(LinkSource.QURANAI);
    expect(reciter.moshaf.recitationCode).toBe(EDITION_ID);
    expect(Number.isInteger(reciter.moshaf.id)).toBe(true);
    expect(reciter.moshaf.id).toBeGreaterThan(0);
    expect(reciter.moshaf.id).toBe(fnv1a(EDITION_ID));
    expect(reciter.moshaf.server).toBe(PROBED_BASE);
    expect(reciter.moshaf.surah_total).toBe(114);
  });

  it('skips a surah edition whose probe has no full-surah audio', async () => {
    mockApi({
      editions: [edition(), edition({ identifier: SILENT_ID })],
      probeAudio: { [EDITION_ID]: `${PROBED_BASE}1.mp3` },
    });

    const reciters = await QuranAiAdapter.getReciters('en');

    expect(reciters).toHaveLength(1);
    expect(reciters[0].moshaf.recitationCode).toBe(EDITION_ID);
  });

  it('builds a 114-item playlist from the probed base URL', async () => {
    const reciters = await QuranAiAdapter.getReciters('ar');
    const playlist = await getPlaylistOf(reciters[0]);

    expect(playlist).toHaveLength(114);
    expect(playlist[0]).toEqual({
      surahId: '1',
      link: `${PROBED_BASE}1.mp3`,
    });
    expect(playlist[113]).toEqual({
      surahId: '114',
      link: `${PROBED_BASE}114.mp3`,
    });
  });

  it('uses the bundled base map for a known edition without probing', async () => {
    const knownId = 'ar.abdulbasitmurattal.hafs';
    mockApi({
      editions: [edition({ identifier: knownId })],
      probeAudio: {},
    });

    const reciters = await QuranAiAdapter.getReciters('ar');

    expect(reciters).toHaveLength(1);
    expect(reciters[0].moshaf.server).toBe(editionBases[knownId]);
    expect(mocks.retryFetch).toHaveBeenCalledTimes(1);
  });

  it('falls back to the localized name when the narrator is unknown', async () => {
    mockApi({
      editions: [
        edition({
          narratorIdentifier: 'quran-unknown',
          name: 'ورش عن نافع',
          englishName: "Warsh A'n Nafi'",
        }),
      ],
      probeAudio: { [EDITION_ID]: `${PROBED_BASE}1.mp3` },
    });

    const reciters = await QuranAiAdapter.getReciters('ar');

    expect(reciters[0].moshaf.riwaya).toBe(Riwaya.WARSH_AN_NAFI);
  });

  it('throws when all candidate editions fail instead of returning an empty catalog', async () => {
    // Every probe returns no playable audio; individual failures are skipped,
    // but losing the whole edition list must surface as a source error.
    mockApi({
      editions: [edition(), edition({ identifier: SILENT_ID })],
      probeAudio: {},
    });

    await expect(QuranAiAdapter.getReciters('ar')).rejects.toThrow(
      /all 2 surah edition\(s\) failed to resolve playable audio/,
    );
  });

  it('returns an empty list when the editions payload has no data array', async () => {
    mocks.retryFetch.mockImplementation((url: string) => {
      if (url === `${BASE_URL}/edition/?format=audio`) {
        return Promise.resolve(jsonResponse({ code: 200, status: 'ok' }));
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    expect(await QuranAiAdapter.getReciters('ar')).toEqual([]);
  });
});
