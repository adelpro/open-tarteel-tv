import type { Mp3QuranV4List, Mp3QuranV4Recitation } from './mp3quran-v4.types';
import type { ReciterSource } from './reciter-source';
import { retryFetch } from './shared-fetch';
import { getMp3QuranV4Config } from '../../config/providers';
import type { Moshaf, Playlist, Reciter } from '../../types';
import { LinkSource, Riwaya } from '../../types';

// API riwayah code -> TV Riwaya slug. Ported from the web adapter; the TV
// Riwaya enum uses slugs rather than the web enum's PascalCase member names.
const RIWAYA_CODES: Record<string, Riwaya> = {
  hafs_an_asim: Riwaya.HAFS_A_ASIM,
  warsh_an_nafi: Riwaya.WARSH_AN_NAFI,
  qalun_an_nafi: Riwaya.QALUN_AN_NAFI,
  khalaf_an_hamzah: Riwaya.KHALAF_AN_HAMZAH,
  bazzi_an_ibn_kathir: Riwaya.AL_BAZZI_AN_IBN_KATHIR,
  qunbul_an_ibn_kathir: Riwaya.AL_BAZZI_AN_IBN_KATHIR,
  susi_an_abu_amr: Riwaya.AL_SOOSI_AN_ABU_AMR,
  duri_an_kisai: Riwaya.ALDURI_AN_ALKAISSAI,
  duri_an_abu_amr: Riwaya.AL_DOORI_AN_ABU_AMR,
  shubah_an_asim: Riwaya.SHUABA_AN_ASIM,
  ibn_dhakwan_an_ibn_amir: Riwaya.IBN_ZAKWAN,
  hisham_an_ibn_amir: Riwaya.HISHAM,
  ibn_jammaz_an_abu_jafar: Riwaya.IBN_JAMMAZ,
  rawh_an_yaqub: Riwaya.YAQOUB,
  ruways_an_yaqub: Riwaya.YAQOUB,
};

const resolveRiwaya = (code?: string): Riwaya =>
  (code && RIWAYA_CODES[code]) || Riwaya.HAFS_A_ASIM;

const fetchAll = async (
  path: string,
  lang: 'ar' | 'en',
  signal?: AbortSignal,
): Promise<Mp3QuranV4Recitation[]> => {
  const { baseUrl } = getMp3QuranV4Config();
  const locale = lang === 'ar' ? 'ar' : 'en';
  let url: string | undefined = `${baseUrl}${path}?locale=${locale}`;
  const items: Mp3QuranV4Recitation[] = [];
  // A provider that echoes the same links.next forever must not spin the
  // serialized catalog load indefinitely.
  const visited = new Set<string>();

  while (url) {
    if (visited.has(url)) {
      throw new Error('MP3Quran v4 pagination cycle detected');
    }
    visited.add(url);

    const response = await retryFetch(url, 3, undefined, signal);
    const body: Mp3QuranV4List<Mp3QuranV4Recitation> = await response.json();
    if (!Array.isArray(body.data)) {
      throw new Error('Unexpected MP3Quran v4 response');
    }
    items.push(...body.data);
    url = body.links?.next
      ? new URL(body.links.next, baseUrl).toString()
      : undefined;
  }

  return items;
};

export const Mp3QuranV4Adapter: ReciterSource = {
  source: LinkSource.MP3QURAN_V4,

  async getReciters(
    lang: 'ar' | 'en',
    signal?: AbortSignal,
  ): Promise<Reciter[]> {
    if (!getMp3QuranV4Config().enabled) return [];

    const recitations = await fetchAll('/recitations', lang, signal);

    return recitations.map((recitation) => {
      const riwayah = recitation.riwayahs[0];
      const moshaf: Moshaf = {
        id: recitation.id,
        name: riwayah?.name ?? recitation.style,
        riwaya: resolveRiwaya(riwayah?.code),
        server: recitation.audio.base,
        surah_total: recitation.coverage.surahs.length,
        surahIds: recitation.coverage.surahs.join(','),
        recitationCode: recitation.code,
        hasTimings: recitation.has_ayah_timings,
        playlist: [],
      };

      return {
        // One reciter can have several recitations (qiraah/tariq variants).
        // Folding the numeric recitation id avoids colliding ids/caches.
        id: `${LinkSource.MP3QURAN_V4}-${recitation.reciter.code}-${recitation.id}`,
        name: recitation.reciter.name,
        source: LinkSource.MP3QURAN_V4,
        moshaf,
      };
    });
  },

  async getPlaylist(reciter: Reciter): Promise<Playlist> {
    if (reciter.source !== LinkSource.MP3QURAN_V4) {
      throw new Error('getPlaylist called for a non-MP3Quran v4 reciter');
    }

    const ids = reciter.moshaf.surahIds?.split(',').filter(Boolean) ?? [];
    return ids.map((id) => ({
      surahId: id,
      link: `${reciter.moshaf.server}${id.padStart(3, '0')}.mp3`,
    }));
  },
};
