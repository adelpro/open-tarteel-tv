import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Reciter } from '../types';

const RECITERS_CACHE_KEY = '@open_tarteel_reciters_cache';
// Reciter catalogs are near-static; 3 days avoids useless refetches on launch.
const CACHE_TTL_MS = 3 * 24 * 60 * 60 * 1000;

interface CachedReciters {
  data: Reciter[];
  timestamp: number;
  lang: 'ar' | 'en';
}

export async function getCachedReciters(
  lang: 'ar' | 'en',
): Promise<Reciter[] | null> {
  try {
    const stored = await AsyncStorage.getItem(RECITERS_CACHE_KEY);
    if (!stored) return null;

    const cached: CachedReciters = JSON.parse(stored);

    if (cached.lang !== lang) return null;
    if (Date.now() - cached.timestamp > CACHE_TTL_MS) return null;

    return cached.data;
  } catch {
    return null;
  }
}

export async function setCachedReciters(
  data: Reciter[],
  lang: 'ar' | 'en',
): Promise<void> {
  try {
    const cached: CachedReciters = {
      data,
      timestamp: Date.now(),
      lang,
    };
    await AsyncStorage.setItem(RECITERS_CACHE_KEY, JSON.stringify(cached));
  } catch {}
}

export async function getRecitersCacheTimestamp(): Promise<number | null> {
  try {
    const stored = await AsyncStorage.getItem(RECITERS_CACHE_KEY);
    if (!stored) return null;

    const cached: CachedReciters = JSON.parse(stored);
    return cached.timestamp;
  } catch {
    return null;
  }
}

export async function clearRecitersCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(RECITERS_CACHE_KEY);
  } catch {}
}
