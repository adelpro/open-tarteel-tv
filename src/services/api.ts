import {
  Reciter,
  mp3QuranAPiResponse,
  MP3APIMoshaf,
  Playlist,
  Riwaya,
  LinkSource,
} from "../types";

const getRiwayaKeyFromMoshafName = (moshafName: string): Riwaya => {
  const lowerName = moshafName.toLowerCase();

  if (lowerName.includes("warsh") || lowerName.includes("ورش")) {
    return Riwaya.WARSH_AN_NAFI;
  }
  if (lowerName.includes("qalun") || lowerName.includes("قالون")) {
    return Riwaya.QALUN_AN_NAFI;
  }
  if (lowerName.includes("alduri") || lowerName.includes("الدوري")) {
    return Riwaya.ALDURI_AN_ALKAISSAI;
  }

  // Default to Hafs
  return Riwaya.HAFS_A_ASIM;
};

const generatePlaylist = (moshaf: MP3APIMoshaf): Playlist => {
  const result = moshaf.surah_list.split(",").map((surahId: string) => ({
    surahId: surahId,
    link: `${moshaf.server}${surahId.padStart(3, "0")}.mp3`,
  }));
  return result;
};

// Function to fetch reciters from MP3Quran API
export async function getAllReciters(): Promise<Reciter[]> {
  try {
    const response = await fetch(
      "https://www.mp3quran.net/api/v3/reciters?language=en",
      { cache: "force-cache" }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch reciters: ${response.status}`);
    }

    const data: mp3QuranAPiResponse = await response.json();
    const reciters: Reciter[] = [];

    for (const apiReciter of data.reciters) {
      for (const apiMoshaf of apiReciter.moshaf) {
        const playlist = generatePlaylist(apiMoshaf);
        const riwaya = getRiwayaKeyFromMoshafName(apiMoshaf.name);

        reciters.push({
          id: apiReciter.id,
          name: apiReciter.name,
          source: LinkSource.MP3QURAN,
          moshaf: {
            id: apiMoshaf.id,
            name: apiMoshaf.name,
            riwaya,
            server: apiMoshaf.server,
            surah_total: apiMoshaf.surah_total,
            playlist,
          },
        });
      }
    }

    return reciters;
  } catch (error) {
    console.error("Error fetching reciters:", error);
    return [];
  }
}
