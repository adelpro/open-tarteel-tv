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
import { getItqanConfig } from '../../config/providers';
import type { Playlist, Reciter } from '../../types';
import { LinkSource } from '../../types';
import { getAppVersion, getClientName } from '../../utils/app-info';
import { isAbortError } from '../../utils/is-abort-error';

// API max page size — fetches every recitation/track in a single request.
const PAGE_SIZE = 1000;
// Identify this app to the Itqan CMS for error tracking and analytics.
const ITQAN_CLIENT_HEADERS = {
  'X-Client-Name': getClientName(),
  'X-Client-Version': getAppVersion(),
};

/**
 * Build the per-request API root and headers. The API root and optional API
 * key come from providers.ts; the app name/version stay tied to app-info.
 */
function getItqanRequest(lang: 'ar' | 'en'): {
  baseUrl: string;
  headers: Record<string, string>;
} {
  const { baseUrl, apiKey } = getItqanConfig();
  return {
    baseUrl,
    headers: {
      'Accept-Language': lang === 'ar' ? 'ar' : 'en',
      ...ITQAN_CLIENT_HEADERS,
      ...(apiKey ? { 'X-API-Key': apiKey } : {}),
    },
  };
}

export const ItqanAdapter: ReciterSource = {
  source: LinkSource.ITQAN,

  async getReciters(
    lang: 'ar' | 'en',
    signal?: AbortSignal,
  ): Promise<Reciter[]> {
    try {
      const { baseUrl, headers } = getItqanRequest(lang);

      const recitationsResponse = await retryFetch(
        `${baseUrl}/recitations/?page_size=${PAGE_SIZE}`,
        3,
        headers,
        signal,
      );
      if (!recitationsResponse.ok) {
        throw new Error(
          `Failed to fetch Itqan recitations: HTTP ${recitationsResponse.status}`,
        );
      }

      const recitationsData: ItqanRecitationResponse =
        await recitationsResponse.json();
      if (!recitationsData || !Array.isArray(recitationsData.results)) {
        throw new Error('Invalid Itqan recitations payload');
      }

      // /recitations/ is not localized (returns English for any Accept-Language).
      // For the Arabic UI, join with /reciters/ to get localized reciter names.
      const arabicReciterNames = await fetchArabicReciterNames(lang, signal);

      // Metadata only. Audio URLs live in the per-recitation tracks endpoint
      // and are fetched lazily on first playback via getPlaylist.
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
      // An abort is a cancelled/superseded load, not a source failure: letting
      // it throw would set ReciterSourceResult.error and flash a false warning.
      if (isAbortError(error)) {
        return [];
      }
      console.error('Itqan API error:', error);
      // Propagate so fetchRecitersBySource records `error` and the UI can tell
      // a dead source apart from a legitimately empty catalog. Individual bad
      // records are still skipped by the guard in the map above.
      throw error;
    }
  },

  async getPlaylist(
    reciter: Reciter,
    lang: 'ar' | 'en',
    signal?: AbortSignal,
  ): Promise<Playlist> {
    if (reciter.source !== LinkSource.ITQAN) {
      throw new Error('getPlaylist called for a non-Itqan reciter');
    }

    const cached = await getCachedItqanPlaylist(reciter.id);
    // An empty cached playlist usually came from a transient malformed detail
    // response; treat it as a miss so the next playback can refetch.
    if (cached && cached.length > 0) return cached;

    const { baseUrl, headers } = getItqanRequest(lang);
    const response = await retryFetch(
      `${baseUrl}/recitations/${reciter.moshaf.id}?page_size=${PAGE_SIZE}`,
      3,
      headers,
      signal,
    );
    if (!response.ok) {
      throw new Error(
        `Failed to fetch Itqan playlist: HTTP ${response.status}`,
      );
    }

    const data: ItqanRecitationDetailResponse = await response.json();
    // Guard each record so one bad track cannot discard the whole playlist.
    const playlist: Playlist = (data.results ?? []).flatMap((surah) => {
      try {
        if (!surah || !surah.audio_url) {
          throw new Error('missing audio URL');
        }
        return [{ surahId: String(surah.surah_number), link: surah.audio_url }];
      } catch {
        console.warn('Skipping malformed Itqan surah:', surah);
        return [];
      }
    });

    await setCachedItqanPlaylist(reciter.id, playlist);
    return playlist;
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
    const { baseUrl, headers } = getItqanRequest(lang);
    const response = await retryFetch(
      `${baseUrl}/reciters/?page_size=${PAGE_SIZE}`,
      3,
      headers,
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
