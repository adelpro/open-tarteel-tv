import { Mp3QuranApiMoshaf } from './mp3quran.types';
import { Playlist, Riwaya } from '../../types';
import { getRiwayaKeyFromMoshafName as getLocalizedRiwayaKey } from '../../utils/get-riwaya-from-mushaf';

// Backwards-compatible one-argument wrapper: legacy callers pass only the
// moshaf name, so keep mapping against the Arabic phrase set as before.
export const getRiwayaKeyFromMoshafName = (name: string): Riwaya =>
  getLocalizedRiwayaKey(name, 'ar');

export const generatePlaylist = (moshaf: Mp3QuranApiMoshaf): Playlist =>
  moshaf.surah_list.split(',').map((id) => ({
    surahId: id,
    link: `${moshaf.server}${id.padStart(3, '0')}.mp3`,
  }));
