import {
  qfFetch,
  resetQuranFoundationClientCache,
} from './quran-foundation.client';
import type {
  QuranFoundationChapterAudioResponse,
  QuranFoundationChapterRecitersResponse,
} from './quranfoundation.types';
import type { ReciterSource } from './reciter-source';
import type { Playlist, Reciter } from '../../types';
import { LinkSource, Riwaya } from '../../types';

const CHAPTER_RECITERS_PATH = '/content/api/v4/resources/chapter_reciters';
const CHAPTER_AUDIO_PATH = '/content/api/v4/chapter_recitations';

// Cache results in-process so concurrent calls don't hammer the provider.
const RESULTS_CACHE_TTL_MS = 55 * 60_000;
type Lang = 'ar' | 'en';
const resultsCache = new Map<
  Lang,
  { reciters: Reciter[]; expiresAt: number }
>();

/** Test/debug helper: clears the cached token and the per-language results. */
export const resetQuranFoundationCache = (): void => {
  resetQuranFoundationClientCache();
  resultsCache.clear();
};

// The API returns short qirat names (e.g. "Hafs", "Warsh"). Default to Hafs.
const RIWAYA_BY_QIRAT = new Map<string, Riwaya>([
  ['hafs', Riwaya.HAFS_A_ASIM],
  ['warsh', Riwaya.WARSH_AN_NAFI],
  ['khalaf', Riwaya.KHALAF_AN_HAMZAH],
  ['albazzi', Riwaya.AL_BAZZI_AN_IBN_KATHIR],
  ['qaloon', Riwaya.QALUN_AN_NAFI],
  ['qalun', Riwaya.QALUN_AN_NAFI],
  ['alsoosi', Riwaya.AL_SOOSI_AN_ABU_AMR],
  ['aldoorikisai', Riwaya.ALDURI_AN_ALKAISSAI],
  ['aldooriabuamr', Riwaya.AL_DOORI_AN_ABU_AMR],
  ['shuaba', Riwaya.SHUABA_AN_ASIM],
  ['ibnzakwan', Riwaya.IBN_ZAKWAN],
  ['hisham', Riwaya.HISHAM],
  ['ibnjammaz', Riwaya.IBN_JAMMAZ],
  ['yaqoub', Riwaya.YAQOUB],
]);

const resolveRiwaya = (qiratName?: string | null): Riwaya =>
  RIWAYA_BY_QIRAT.get((qiratName ?? '').toLowerCase().replace(/[^a-z]/g, '')) ??
  Riwaya.HAFS_A_ASIM;

/** `translated_name.name` is the localized value; `name` is the Latin fallback. */
const resolveReciterName = (
  reciter: QuranFoundationChapterRecitersResponse['reciters'][number],
): string => reciter.translated_name?.name || reciter.name || '';

const mapReciter = (
  reciter: QuranFoundationChapterRecitersResponse['reciters'][number],
): Reciter | null => {
  const name = resolveReciterName(reciter);
  if (!name) return null;

  return {
    id: `${LinkSource.QURAN_FOUNDATION}-${reciter.id}`,
    name,
    source: LinkSource.QURAN_FOUNDATION,
    moshaf: {
      id: reciter.id,
      name,
      riwaya: resolveRiwaya(reciter.qirat?.name),
      server: '',
      // The lazy playlist fetch replaces this with the real track count.
      surah_total: 114,
      playlist: [],
    },
  };
};

// Serialize concurrent calls so the configured pacing stays within limits.
let queue: Promise<unknown> = Promise.resolve();

export const QuranFoundationAdapter: ReciterSource = {
  source: LinkSource.QURAN_FOUNDATION,

  getReciters(lang: Lang, signal?: AbortSignal): Promise<Reciter[]> {
    const run = async (): Promise<Reciter[]> => {
      const cached = resultsCache.get(lang);
      if (cached && cached.expiresAt > Date.now()) return cached.reciters;

      const response = await qfFetch(
        `${CHAPTER_RECITERS_PATH}?language=${lang}`,
        { signal },
      );
      const data: QuranFoundationChapterRecitersResponse =
        await response.json();

      if (!Array.isArray(data.reciters)) {
        throw new Error('Unexpected quran.foundation reciters response');
      }

      const reciters = data.reciters
        .map(mapReciter)
        .filter((reciter): reciter is Reciter => reciter !== null);

      resultsCache.set(lang, {
        reciters,
        expiresAt: Date.now() + RESULTS_CACHE_TTL_MS,
      });
      return reciters;
    };

    const result = queue.then(run, run);
    queue = result.catch(() => undefined);
    return result;
  },

  async getPlaylist(
    reciter: Reciter,
    _lang?: Lang,
    signal?: AbortSignal,
  ): Promise<Playlist> {
    if (reciter.source !== LinkSource.QURAN_FOUNDATION) {
      throw new Error('getPlaylist called for a non-Quran-Foundation reciter');
    }

    const response = await qfFetch(
      `${CHAPTER_AUDIO_PATH}/${reciter.moshaf.id}`,
      { signal },
    );
    const data: QuranFoundationChapterAudioResponse = await response.json();

    if (!Array.isArray(data.audio_files)) {
      throw new Error(
        `Unexpected audio response for reciter ${reciter.moshaf.id}`,
      );
    }

    return [...data.audio_files]
      .sort((a, b) => a.chapter_id - b.chapter_id)
      .map((audioFile) => ({
        surahId: String(audioFile.chapter_id),
        link: audioFile.audio_url,
      }));
  },
};
