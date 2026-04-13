import { getRiwayaKeyFromMoshafName } from './mp3quran.helpers';
import type { ReciterSource } from './reciter-source';
import { retryFetch } from './shared-fetch';
import type { Playlist, Reciter } from '../../types';
import type { CustomApiReciter, CustomApiResponse } from './custom.types';

const SOURCE = 'custom';
const BASE_URL = 'https://example.com/api';

/**
 * Transform a single raw reciter into a normalized Reciter.
 */
const normalizeReciter = (raw: CustomApiReciter): Reciter => {
  const playlist: Playlist = [
    {
      surahId: String(raw.id),
      link: raw.audioUrl,
    },
  ];

  return {
    id: `${SOURCE}-${raw.id}`,
    name: raw.reciterName,
    source: SOURCE as Reciter['source'],
    moshaf: {
      id: raw.id,
      name: raw.name,
      riwaya: getRiwayaKeyFromMoshafName(raw.name),
      server: '',
      surah_total: playlist.length,
      playlist,
    },
  };
};

export const CustomAdapter: ReciterSource = {
  source: SOURCE,

  async getReciters(_lang: 'ar' | 'en'): Promise<Reciter[]> {
    try {
      const response = await retryFetch(`${BASE_URL}/reciters`);

      if (!response.ok) {
        throw new Error(`Failed to fetch reciters: HTTP ${response.status}`);
      }

      const data: CustomApiResponse = await response.json();

      return data.reciters.map(normalizeReciter);
    } catch (error) {
      console.error('Custom API error:', error);
      return [];
    }
  },
};
