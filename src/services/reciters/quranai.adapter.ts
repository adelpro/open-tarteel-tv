import editionBases from './quranai-bases.json';
import {
  buildSurahAudioUrl,
  buildSurahEndpoint,
  extractSurahAudio,
  extractSurahAudioBaseUrl,
  resolveReciterName,
  resolveRiwayaFromEdition,
  stableIdFromIdentifier,
} from './quranai.helpers';
import type {
  QuranAiEdition,
  QuranAiEditionListResponse,
  QuranAiSurahResponse,
} from './quranai.types';
import type { ReciterSource } from './reciter-source';
import { retryFetch } from './shared-fetch';
import { getQuranAiConfig } from '../../config/providers';
import type { Playlist, Reciter } from '../../types';
import { LinkSource } from '../../types';

const SURAH_TOTAL = 114;
const EDITION_FETCH_CONCURRENCY = 3;
const PROBE_SURAH_NUMBER = 1;

// Stable edition -> CDN base entries copied verbatim from the web adapter.
const EDITION_BASE_MAP = new Map<string, string>(Object.entries(editionBases));

const mapWithConcurrency = async <T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> => {
  const indexedItems = items.map((item, index) => ({ item, index }));
  const results = new Map<number, R>();
  let nextIndex = 0;

  const worker = async (): Promise<void> => {
    while (nextIndex < indexedItems.length) {
      const entry = indexedItems[nextIndex];
      nextIndex += 1;
      if (entry) {
        const mapped = await mapper(entry.item, entry.index);
        results.set(entry.index, mapped);
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );

  return items.map((_, index) => results.get(index) as R);
};

const selectSurahEditions = (editions: QuranAiEdition[]): QuranAiEdition[] => {
  const seen = new Set<string>();
  const surahEditions: QuranAiEdition[] = [];
  for (const edition of editions) {
    if (edition.type !== 'surah') continue;
    if (seen.has(edition.identifier)) continue;
    seen.add(edition.identifier);
    surahEditions.push(edition);
  }
  return surahEditions;
};

const fetchEditionBase = async (
  baseUrl: string,
  editionIdentifier: string,
  signal?: AbortSignal,
): Promise<string | null> => {
  const knownBase = EDITION_BASE_MAP.get(editionIdentifier);
  if (knownBase) return knownBase;

  try {
    const response = await retryFetch(
      buildSurahEndpoint(baseUrl, PROBE_SURAH_NUMBER, editionIdentifier, {
        limit: 1,
      }),
      3,
      undefined,
      signal,
    );
    const body: QuranAiSurahResponse = await response.json();
    const probeAudioUrl = extractSurahAudio(body.data);
    if (!probeAudioUrl) {
      console.warn(
        `Quran.ai: no full-surah audio for edition ${editionIdentifier}`,
      );
      return null;
    }

    const audioBase = extractSurahAudioBaseUrl(probeAudioUrl);
    if (!audioBase) {
      console.warn(
        `Quran.ai: invalid full-surah audio URL for edition ${editionIdentifier}: ${probeAudioUrl}`,
      );
      return null;
    }

    return audioBase;
  } catch {
    return null;
  }
};

export const QuranAiAdapter: ReciterSource = {
  source: LinkSource.QURANAI,

  async getReciters(
    lang: 'ar' | 'en',
    signal?: AbortSignal,
  ): Promise<Reciter[]> {
    const { baseUrl } = getQuranAiConfig();
    const response = await retryFetch(
      `${baseUrl}/edition/?format=audio`,
      3,
      undefined,
      signal,
    );
    const body: QuranAiEditionListResponse = await response.json();
    const editions = Array.isArray(body.data)
      ? selectSurahEditions(body.data)
      : [];

    const results = await mapWithConcurrency(
      editions,
      EDITION_FETCH_CONCURRENCY,
      async (edition) => {
        try {
          const server = await fetchEditionBase(
            baseUrl,
            edition.identifier,
            signal,
          );
          if (!server) {
            console.warn(
              `Quran.ai: skipping edition ${edition.identifier}: no playable surah audio`,
            );
            return null;
          }
          const riwaya = resolveRiwayaFromEdition(edition, lang);
          const reciter: Reciter = {
            id: `${LinkSource.QURANAI}-${edition.identifier}`,
            name: resolveReciterName(edition, lang),
            source: LinkSource.QURANAI,
            moshaf: {
              id: stableIdFromIdentifier(edition.identifier),
              recitationCode: edition.identifier,
              name: riwaya,
              riwaya,
              server,
              surah_total: SURAH_TOTAL,
              playlist: [],
            },
          };
          return reciter;
        } catch (error) {
          console.warn(
            `Quran.ai: skipping edition ${edition.identifier}: ${error instanceof Error ? error.message : String(error)}`,
          );
          return null;
        }
      },
    );

    const reciters = results.filter(
      (reciter): reciter is Reciter => reciter !== null,
    );

    // Individual bad editions are skipped above, but losing *every* candidate
    // is a source outage, not an empty catalog. Surface it so the home screen
    // shows the "sources unavailable" warning instead of "no reciters".
    if (editions.length > 0 && reciters.length === 0 && !signal?.aborted) {
      throw new Error(
        `Quran.ai: all ${editions.length} surah edition(s) failed to resolve playable audio`,
      );
    }

    return reciters;
  },

  async getPlaylist(reciter: Reciter): Promise<Playlist> {
    if (reciter.source !== LinkSource.QURANAI) {
      throw new Error('getPlaylist called for a non-Qurani.ai reciter');
    }

    const { server, surah_total: surahTotal } = reciter.moshaf;
    if (!server) return [];

    const total = Number(surahTotal) || SURAH_TOTAL;
    return Array.from({ length: total }, (_, index) => {
      const surahNumber = index + 1;
      return {
        surahId: String(surahNumber),
        link: buildSurahAudioUrl(server, surahNumber),
      };
    });
  },
};
