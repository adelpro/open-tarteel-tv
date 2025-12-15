import i18n from "../i18n/config";
import {
  Reciter,
  mp3QuranAPiResponse,
  MP3APIMoshaf,
  Playlist,
  Riwaya,
  LinkSource,
} from "../types";

// Language mapping for API endpoints
type APILanguage = "en" | "ar";

const languageMap: { [key: string]: APILanguage } = {
  en: "en",
  ar: "ar",
};

/**
 * Get the API language parameter based on current i18n language
 */
const getAPILanguage = (): APILanguage => {
  const currentLanguage = i18n.language || "en";
  return languageMap[currentLanguage] || "en";
};

/**
 * Decode Arabic text properly if needed
 * Handles UTF-8 encoding/decoding for Arabic characters
 */
const decodeText = (text: string): string => {
  if (!text) return text;
  try {
    // If the text is already properly encoded, return as is
    // This handles both native Arabic and pre-encoded text
    return decodeURIComponent(text);
  } catch {
    // If decoding fails, return original text
    return text;
  }
};

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

/**
 * Helper function to fetch with timeout
 */
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

/**
 * Retry logic with exponential backoff
 * Handles network failures and temporary unavailability
 */
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
      console.warn(
        `Fetch attempt ${attempt}/${maxAttempts} failed:`,
        lastError.message
      );

      if (attempt < maxAttempts) {
        // Exponential backoff: 1s, 2s, 4s
        const waitTime = 1000 * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError || new Error("Failed to fetch after all attempts");
};

/**
 * Fetch reciters from MP3Quran API with multi-language support
 * Supports both English (en) and Arabic (ar) language endpoints
 * Properly handles RTL content and Arabic character encoding
 * 
 * @param language Optional: specific language to fetch ('en' or 'ar'). Defaults to current i18n language.
 * @returns Promise<Reciter[]> Array of reciter objects with playlists
 * @throws Error if fetch fails after retries or if response is invalid
 */
export async function getAllReciters(language?: string): Promise<Reciter[]> {
  try {
    const apiLanguage = language ? (languageMap[language] || "en") : getAPILanguage();
    const apiUrl = `https://www.mp3quran.net/api/v3/reciters?language=${apiLanguage}`;
    
    console.debug(`Fetching reciters with language: ${apiLanguage}`);
    
    const response = await retryFetch(apiUrl);

    const data: mp3QuranAPiResponse = await response.json();
    const reciters: Reciter[] = [];

    for (const apiReciter of data.reciters) {
      for (const apiMoshaf of apiReciter.moshaf) {
        const playlist = generatePlaylist(apiMoshaf);
        const riwaya = getRiwayaKeyFromMoshafName(apiMoshaf.name);

        // Properly decode reciter name and moshaf name for Arabic text
        const reciterName = decodeText(apiReciter.name);
        const moshafName = decodeText(apiMoshaf.name);

        reciters.push({
          id: apiReciter.id,
          name: reciterName,
          source: LinkSource.MP3QURAN,
          moshaf: {
            id: apiMoshaf.id,
            name: moshafName,
            riwaya,
            server: apiMoshaf.server,
            surah_total: apiMoshaf.surah_total,
            playlist,
          },
        });
      }
    }

    console.debug(`Successfully fetched ${reciters.length} reciters`);
    return reciters;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching reciters:", errorMessage);
    throw error; // Re-throw so caller can handle it
  }
}

/**
 * Get available languages for API
 */
export function getAvailableAPILanguages(): APILanguage[] {
  return ["en", "ar"];
}
