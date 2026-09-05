import {
  generatePlaylist,
  getRiwayaKeyFromMoshafName,
} from './mp3quran.helpers';
import { Mp3QuranApiResponse } from './mp3quran.types';
import { ReciterSource } from './reciter-source';
import { retryFetch } from './shared-fetch';
import { LinkSource, Reciter } from '../../types';

export const Mp3QuranAdapter: ReciterSource = {
  source: LinkSource.MP3QURAN,

  async getReciters(lang: 'ar' | 'en', signal?: AbortSignal) {
    const apiLang = lang === 'en' ? 'eng' : 'ar';

    const response = await retryFetch(
      `https://www.mp3quran.net/api/v3/reciters?language=${apiLang}`,
      3,
      undefined,
      signal,
    );

    const data: Mp3QuranApiResponse = await response.json();
    const reciters: Reciter[] = [];

    for (const apiReciter of data.reciters) {
      for (const apiMoshaf of apiReciter.moshaf) {
        reciters.push({
          id: `${LinkSource.MP3QURAN}-${apiReciter.id}-${apiMoshaf.id}`,
          name: apiReciter.name,
          source: LinkSource.MP3QURAN,
          moshaf: {
            id: apiMoshaf.id,
            name: apiMoshaf.name,
            riwaya: getRiwayaKeyFromMoshafName(apiMoshaf.name),
            server: apiMoshaf.server,
            surah_total: apiMoshaf.surah_total,
            playlist: generatePlaylist(apiMoshaf),
          },
        });
      }
    }

    return reciters;
  },
};
