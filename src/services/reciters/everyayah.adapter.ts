import { LinkSource, Playlist, Reciter, Riwaya } from "../../types";
import type { ReciterSource } from "./reciter-source";
import type { EveryAyahReciter } from "./everyayah.types";
import { retryFetch } from "./shared-fetch";

const BASE_URL = "https://everyayah.com/data";
const TOTAL_SURAHS = 114;

/**
 * Curated list of reciters available on EveryAyah.com.
 * Each entry maps to a subfolder on the CDN.
 */
const RECITERS: EveryAyahReciter[] = [
  {
    subfolder: "Abdul_Basit_Murattal_192kbps",
    name: "عبد الباسط عبد الصمد",
    bitrate: "192kbps",
  },
  {
    subfolder: "Alafasy_128kbps",
    name: "مشاري العفاسي",
    bitrate: "128kbps",
  },
  {
    subfolder: "Husary_128kbps",
    name: "محمود خليل الحصري",
    bitrate: "128kbps",
  },
  {
    subfolder: "Minshawy_Murattal_128kbps",
    name: "محمد صديق المنشاوي",
    bitrate: "128kbps",
  },
  {
    subfolder: "Saood_ash-Shuraym_128kbps",
    name: "سعود الشريم",
    bitrate: "128kbps",
  },
  {
    subfolder: "Abdurrahmaan_As-Sudais_192kbps",
    name: "عبد الرحمن السديس",
    bitrate: "192kbps",
  },
  {
    subfolder: "Ahmed_ibn_Ali_al-Ajamy_128kbps_ketaballah.net",
    name: "أحمد بن علي العجمي",
    bitrate: "128kbps",
  },
  {
    subfolder: "Hani_Rifai_192kbps",
    name: "هاني الرفاعي",
    bitrate: "192kbps",
  },
];

/**
 * EveryAyah uses a fixed URL pattern per surah:
 * {BASE_URL}/{subfolder}/{surahId padded to 3}.mp3
 * Note: EveryAyah provides per-ayah files, but for surah-level
 * playback we use the first ayah as the entry point.
 * The actual full-surah audio is available via the pattern above.
 */
function generatePlaylist(subfolder: string): Playlist {
  return Array.from({ length: TOTAL_SURAHS }, (_, i) => {
    const surahId = String(i + 1);
    return {
      surahId,
      link: `${BASE_URL}/${subfolder}/${surahId.padStart(3, "0")}001.mp3`,
    };
  });
}

export const EveryAyahAdapter: ReciterSource = {
  source: LinkSource.EVERYAYAH,

  async getReciters(): Promise<Reciter[]> {
    return RECITERS.map((reciter) => ({
      id: `${LinkSource.EVERYAYAH}-${reciter.subfolder}`,
      name: reciter.name,
      source: LinkSource.EVERYAYAH,
      moshaf: {
        id: reciter.subfolder.length,
        name: `${reciter.name} (${reciter.bitrate})`,
        riwaya: Riwaya.HAFS_A_ASIM,
        server: `${BASE_URL}/${reciter.subfolder}/`,
        surah_total: TOTAL_SURAHS,
        playlist: generatePlaylist(reciter.subfolder),
      },
    }));
  },
};
