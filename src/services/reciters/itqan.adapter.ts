import {
  getCachedItqanPlaylist,
  setCachedItqanPlaylist,
} from './itqan-playlist-cache';
import type {
  ItqanRecitationDetailResponse,
  ItqanRecitationResponse,
  ItqanReciterResponse,
} from './itqan.types';
import { getRiwayaKeyFromMoshafName } from './mp3quran.helpers';
import type { ReciterSource } from './reciter-source';
import { retryFetch } from './shared-fetch';
import type { Playlist, Reciter } from '../../types';
import { LinkSource } from '../../types';

const BASE_URL = 'https://api.cms.itqan.dev';
// API max page size — fetches every recitation/track in a single request.
const PAGE_SIZE = 1000;

export const ItqanAdapter: ReciterSource = {
  source: LinkSource.ITQAN,

  async getReciters(
    lang: 'ar' | 'en',
    signal?: AbortSignal,
  ): Promise<Reciter[]> {
    try {
      const acceptLanguage = lang === 'ar' ? 'ar' : 'en';

      const recitationsResponse = await retryFetch(
        `${BASE_URL}/recitations/?page_size=${PAGE_SIZE}`,
        3,
        { 'Accept-Language': acceptLanguage },
        signal,
      );
      if (!recitationsResponse.ok) {
        throw new Error(
          `Failed to fetch Itqan recitations: HTTP ${recitationsResponse.status}`,
        );
      }

      const recitationsData: ItqanRecitationResponse =
        await recitationsResponse.json();

      // /recitations/ is not localized (returns English for any Accept-Language).
      // For the Arabic UI, join with /reciters/ to get localized reciter names.
      const arabicReciterNames = await fetchArabicReciterNames(lang, signal);

      // Metadata only. Audio URLs live in the per-recitation tracks endpoint
      // and are fetched lazily on first playback via getItqanPlaylist.
      // Guard each record so one malformed recitation cannot wipe the whole source.
      const reciters: (Reciter | null)[] = recitationsData.results.map(
        (recitation) => {
          try {
            return {
              id: `${LinkSource.ITQAN}-${recitation.reciter.id}-${recitation.id}`,
              name:
                arabicReciterNames?.get(recitation.reciter.id) ??
                recitation.reciter.name,
              source: LinkSource.ITQAN,
              moshaf: {
                id: recitation.id,
                name: recitation.name,
                riwaya: getRiwayaKeyFromMoshafName(
                  recitation.riwayah?.name ?? '',
                ),
                server: '',
                surah_total: recitation.surahs_count,
                playlist: [],
              },
            } satisfies Reciter;
          } catch {
            console.warn(
              `Skipping malformed Itqan recitation ${recitation.id}:`,
              recitation,
            );
            return null;
          }
        },
      );

      return reciters.filter((r): r is Reciter => r !== null);
    } catch (error) {
      console.error('Itqan API error:', error);
      // Return empty array to gracefully handle Itqan API failures
      // MP3Quran will still provide reciters
      return [];
    }
  },
};

/**
 * Fetch localized reciter names (id -> name) for the Arabic UI.
 * Returns null when not needed (English) or on failure so the caller
 * falls back to the names embedded in /recitations/.
 */
async function fetchArabicReciterNames(
  lang: 'ar' | 'en',
  signal?: AbortSignal,
): Promise<Map<number, string> | null> {
  if (lang !== 'ar') return null;

  try {
    const response = await retryFetch(
      `${BASE_URL}/reciters/?page_size=${PAGE_SIZE}`,
      3,
      { 'Accept-Language': 'ar' },
      signal,
    );
    if (!response.ok) return null;

    const data: ItqanReciterResponse = await response.json();
    const names = new Map<number, string>();
    for (const reciter of data.results) {
      names.set(reciter.id, reciter.name);
    }
    return names;
  } catch {
    return null;
  }
}

/**
 * Fetch the full 114-surah playlist (audio URLs) for an Itqan reciter.
 * Cache-first; falls back to the recitation tracks endpoint.
 */
export async function getItqanPlaylist(reciter: Reciter): Promise<Playlist> {
  if (reciter.source !== LinkSource.ITQAN) {
    throw new Error('getItqanPlaylist called for a non-Itqan reciter');
  }

  const cached = await getCachedItqanPlaylist(reciter.id);
  if (cached) return cached;

  const recitationId = reciter.moshaf.id;
  const response = await retryFetch(
    `${BASE_URL}/recitations/${recitationId}?page_size=${PAGE_SIZE}`,
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch Itqan playlist: HTTP ${response.status}`);
  }

  const data: ItqanRecitationDetailResponse = await response.json();
  const playlist: Playlist = data.results.map((surah) => ({
    surahId: String(surah.surah_number),
    link: surah.audio_url,
  }));

  await setCachedItqanPlaylist(reciter.id, playlist);
  return playlist;
}
