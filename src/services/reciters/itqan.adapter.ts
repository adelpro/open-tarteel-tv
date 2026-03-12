import type {
  ItqanRecitationDetailResponse,
  ItqanRecitationResponse,
} from './itqan.types';
import { getRiwayaKeyFromMoshafName } from './mp3quran.helpers';
import type { ReciterSource } from './reciter-source';
import { retryFetch } from './shared-fetch';
import type { Playlist } from '../../types';
import { LinkSource, Reciter } from '../../types';

const BASE_URL = 'https://api.cms.itqan.dev';

export const ItqanAdapter: ReciterSource = {
  source: LinkSource.ITQAN,

  async getReciters(): Promise<Reciter[]> {
    try {
      const recitationsResponse = await retryFetch(`${BASE_URL}/recitations/`);
      if (!recitationsResponse.ok) {
        throw new Error(
          `Failed to fetch Itqan recitations: HTTP ${recitationsResponse.status}`,
        );
      }

      const recitationsData: ItqanRecitationResponse =
        await recitationsResponse.json();

      // Use explicit type: Array<Reciter | null>
      const reciters: (Reciter | null)[] = await Promise.all(
        recitationsData.results.map(async (recitation) => {
          try {
            const recitationsDetailResponse = await retryFetch(
              `${BASE_URL}/recitations/${recitation.id}`,
            );
            if (!recitationsDetailResponse.ok) {
              throw new Error(
                `Failed to fetch recitations for ${recitation.name}: HTTP ${recitationsDetailResponse.status}`,
              );
            }

            const recitationDetailData: ItqanRecitationDetailResponse =
              await recitationsDetailResponse.json();

            const playlist: Playlist = recitationDetailData.results.map(
              (surah) => ({
                surahId: String(surah.surah_number),
                link: surah.audio_url,
              }),
            );

            const riwaya = getRiwayaKeyFromMoshafName(recitation.riwayah.name);

            return {
              id: `${LinkSource.ITQAN}-${recitation.reciter.id}-${recitation.id}`,
              name: recitation.reciter.name,
              source: LinkSource.ITQAN,
              moshaf: {
                id: recitation.reciter.id,
                name: recitation.name,
                riwaya,
                server: '',
                surah_total: playlist.length,
                playlist,
              },
            } satisfies Reciter;
          } catch (error) {
            console.warn(`Skipping reciter ${recitation.reciter.name}:`, error);
            return null;
          }
        }),
      );

      // Filter out nulls
      return reciters.filter((r): r is Reciter => r !== null);
    } catch (error) {
      console.error('Itqan API error:', error);
      // Return empty array to gracefully handle Itqan API failures
      // MP3Quran will still provide reciters
      return [];
    }
  },
};
