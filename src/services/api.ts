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

// Helper function to fetch with timeout
const fetchWithTimeout = (
  url: string,
  timeoutMs: number = 10000
): Promise<Response> => {
  return Promise.race([
    fetch(url),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error("Fetch timeout")), timeoutMs)
    ),
  ]);
};

// Retry logic with exponential backoff
const retryFetch = async (
  url: string,
  maxAttempts: number = 3
): Promise<Response> => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetchWithTimeout(url);
      if (response.ok) {
        return response;
      }
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      // Silent fail for retry attempt

      if (attempt < maxAttempts) {
        // Exponential backoff: 1s, 2s, 4s
        const waitTime = 1000 * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError || new Error("Failed to fetch after all attempts");
};

// Function to fetch reciters from MP3Quran API
export async function getAllReciters(lang: string): Promise<Reciter[]> {
  if (lang !== "ar" && lang !== "en") {
    throw new Error(`Invalid language: ${lang}`);
  }
  try {
    const response = await retryFetch(
      `https://www.mp3quran.net/api/v3/reciters?language=${lang}`
    );

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
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    // Failed to fetch reciters
    throw error; // Re-throw so HomeScreen can handle it
  }
}
