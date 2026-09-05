import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Playlist } from '../../types';

const ITQAN_PLAYLIST_CACHE_KEY = '@open_tarteel_itqan_playlist_cache';
// Playlist URLs are stable; 3 days avoids refetching on every open.
const CACHE_TTL_MS = 3 * 24 * 60 * 60 * 1000;

interface CachedPlaylist {
  playlist: Playlist;
  timestamp: number;
}

type PlaylistCacheMap = Record<string, CachedPlaylist>;

export async function clearItqanPlaylistCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ITQAN_PLAYLIST_CACHE_KEY);
  } catch {}
}

export async function getCachedItqanPlaylist(
  reciterId: string,
): Promise<Playlist | null> {
  try {
    const stored = await AsyncStorage.getItem(ITQAN_PLAYLIST_CACHE_KEY);
    if (!stored) return null;

    const cache: PlaylistCacheMap = JSON.parse(stored);
    const entry = cache[reciterId];
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) return null;

    return entry.playlist;
  } catch {
    return null;
  }
}

export async function setCachedItqanPlaylist(
  reciterId: string,
  playlist: Playlist,
): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(ITQAN_PLAYLIST_CACHE_KEY);
    const cache: PlaylistCacheMap = stored ? JSON.parse(stored) : {};

    const now = Date.now();
    for (const key of Object.keys(cache)) {
      if (now - cache[key].timestamp > CACHE_TTL_MS) {
        delete cache[key];
      }
    }

    cache[reciterId] = { playlist, timestamp: now };
    await AsyncStorage.setItem(ITQAN_PLAYLIST_CACHE_KEY, JSON.stringify(cache));
  } catch {}
}
