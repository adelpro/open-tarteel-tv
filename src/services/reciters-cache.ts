import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Reciter } from '../types';

const RECITERS_CACHE_KEY = '@open_tarteel_reciters_cache';
// Reciter catalogs are near-static; 3 days avoids useless refetches on launch.
const CACHE_TTL_MS = 3 * 24 * 60 * 60 * 1000;
// Below this age the cached list is served without any background refresh.
export const SOFT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface CachedReciters {
  data: Reciter[];
  sources: Record<string, Reciter[]>;
  sourcesKey: string;
  timestamp: number;
  lang: 'ar' | 'en';
}

export type CachedRecitersInfo = {
  data: Reciter[];
  sources: Record<string, Reciter[]>;
  sourcesKey: string;
  timestamp: number;
};

function isFresh(cached: CachedReciters, lang: 'ar' | 'en'): boolean {
  return cached.lang === lang && Date.now() - cached.timestamp <= CACHE_TTL_MS;
}

export async function getCachedReciters(
  lang: 'ar' | 'en',
): Promise<Reciter[] | null> {
  const info = await getCachedRecitersInfo(lang);
  return info ? info.data : null;
}

export async function getCachedRecitersInfo(
  lang: 'ar' | 'en',
): Promise<CachedRecitersInfo | null> {
  try {
    const stored = await AsyncStorage.getItem(RECITERS_CACHE_KEY);
    if (!stored) return null;

    const cached: CachedReciters = JSON.parse(stored);
    if (!isFresh(cached, lang)) return null;

    return {
      data: cached.data,
      sources: cached.sources ?? {},
      sourcesKey: cached.sourcesKey ?? '',
      timestamp: cached.timestamp,
    };
  } catch {
    return null;
  }
}

export async function setCachedReciters(
  sources: Record<string, Reciter[]>,
  lang: 'ar' | 'en',
): Promise<void> {
  try {
    const cached: CachedReciters = {
      data: Object.values(sources).flat(),
      sources,
      sourcesKey: Object.keys(sources).sort().join('|'),
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
