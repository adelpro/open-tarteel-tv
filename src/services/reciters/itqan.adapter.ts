import { LinkSource, Reciter, Riwaya } from "../../types";
import type { Playlist } from "../../types";
import type { ReciterSource } from "./reciter-source";
import type {
  ItqanReciterResponse,
  ItqanRecitationResponse,
} from "./itqan.types";

const BASE_URL = "https://api.cms.itqan.dev";

export const ItqanAdapter: ReciterSource = {
  source: LinkSource.ITQAN,

  async getReciters(): Promise<Reciter[]> {
    const recitersResponse = await fetch(`${BASE_URL}/reciters/`);
    if (!recitersResponse.ok) {
      throw new Error("Failed to fetch Itqan reciters");
    }

    const recitersData: ItqanReciterResponse = await recitersResponse.json();

    // Use explicit type: Array<Reciter | null>
    const recitersWithNulls: Array<Reciter | null> = await Promise.all(
      recitersData.results.map(async (reciter) => {
        try {
          const recitationsResponse = await fetch(
            `${BASE_URL}/recitations/${reciter.id}`
          );
          if (!recitationsResponse.ok) {
            throw new Error(`Failed to fetch recitations for ${reciter.name}`);
          }

          const recitations: ItqanRecitationResponse =
            await recitationsResponse.json();

          const playlist: Playlist = recitations.results.map((surah) => ({
            surahId: String(surah.surah_number),
            link: surah.audio_url,
          }));

          return {
            id: reciter.id,
            name: reciter.name,
            source: LinkSource.ITQAN,
            moshaf: {
              id: reciter.id,
              name: `${reciter.name} Mushaf`,
              riwaya: Riwaya.HAFS_A_ASIM,
              server: "",
              surah_total: playlist.length,
              playlist,
            },
          } satisfies Reciter;
        } catch (error) {
          console.warn(`Skipping reciter ${reciter.name}:`, error);
          return null;
        }
      })
    );

    // Filter out nulls to satisfy Reciter[]
    const reciters: Reciter[] = recitersWithNulls.filter(
      (r): r is Reciter => r !== null
    );

    return reciters;
  },
};
