import { LinkSource, Reciter, Riwaya } from "../../types";
import type { Playlist } from "../../types";
import type { ReciterSource } from "./reciter-source";
import type {
  ItqanReciterResponse,
  ItqanRecitationResponse,
  ItqanRecitationDetailResponse,
} from "./itqan.types";
import { getRiwayaKeyFromMoshafName } from "./mp3quran.helpers";

const BASE_URL = "https://api.cms.itqan.dev";

export const ItqanAdapter: ReciterSource = {
  source: LinkSource.ITQAN,

  async getReciters(): Promise<Reciter[]> {
    const recitationsResponse = await fetch(`${BASE_URL}/recitations/`);
    if (!recitationsResponse.ok) {
      throw new Error("Failed to fetch Itqan recitations");
    }

    const recitationsData: ItqanRecitationResponse =
      await recitationsResponse.json();

    // Use explicit type: Array<Reciter | null>
    const reciters: Array<Reciter | null> = await Promise.all(
      recitationsData.results.map(async (recitation) => {
        try {
          const recitationsDetailResponse = await fetch(
            `${BASE_URL}/recitations/${recitation.id}`
          );
          if (!recitationsDetailResponse.ok) {
            throw new Error(
              `Failed to fetch recitations for ${recitation.name}`
            );
          }

          const recitationDetailData: ItqanRecitationDetailResponse =
            await recitationsDetailResponse.json();

          const playlist: Playlist = recitationDetailData.results.map(
            (surah) => ({
              surahId: String(surah.surah_number),
              link: surah.audio_url,
            })
          );

          const riwaya = getRiwayaKeyFromMoshafName(recitation.riwayah.name);

          return {
            id: `${LinkSource.ITQAN}-${recitation.reciter.id}`,
            name: recitation.reciter.name,
            source: LinkSource.ITQAN,
            moshaf: {
              id: recitation.reciter.id,
              name: recitation.name,
              riwaya,
              server: "",
              surah_total: playlist.length,
              playlist,
            },
          } satisfies Reciter;
        } catch (error) {
          console.warn(`Skipping reciter ${recitation.reciter.name}:`, error);
          return null;
        }
      })
    );

    // Filter out nulls
    return reciters.filter((r): r is Reciter => r !== null);
  },
};
