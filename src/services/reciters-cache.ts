import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Reciter } from '../types';

const LEGACY_CACHE_KEY = '@open_tarteel_reciters_cache';
const INDEX_KEY = '@open_tarteel_reciters_index';
const CHUNK_PREFIX = '@open_tarteel_reciters_chunk/';
// Keep each AsyncStorage row well below Android's ~2 MB CursorWindow limit.
const CHUNK_SIZE = 50;

// Reciter catalogs are near-static; 3 days avoids useless refetches on launch.
const CACHE_TTL_MS = 3 * 24 * 60 * 60 * 1000;
// Below this age the cached list is served without any background refresh.
export const SOFT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface IndexedSource {
  name: string;
  chunkCount: number;
  count: number;
}

interface RecitersIndex {
  version: 1;
  sourcesKey: string;
  timestamp: number;
  lang: 'ar' | 'en';
  // Metadata only. Reciter data lives in the chunk rows, never in this one.
  blocks: IndexedSource[];
}

export type CachedRecitersInfo = {
  data: Reciter[];
  sources: Record<string, Reciter[]>;
  sourcesKey: string;
  timestamp: number;
};

function chunkKey(source: string, index: number): string {
  return `${CHUNK_PREFIX}${source}/${index}`;
}

/** Split a catalog into bounded rows so no single AsyncStorage value is huge. */
export function chunkReciters(
  reciters: Reciter[],
  size = CHUNK_SIZE,
): Reciter[][] {
  if (size < 1) return [];
  const chunks: Reciter[][] = [];
  for (let i = 0; i < reciters.length; i += size) {
    chunks.push(reciters.slice(i, i + size));
  }
  return chunks;
}

function isValidIndex(value: unknown): value is RecitersIndex {
  if (!value || typeof value !== 'object') return false;
  const index = value as RecitersIndex;
  return (
    index.version === 1 &&
    typeof index.timestamp === 'number' &&
    (index.lang === 'ar' || index.lang === 'en') &&
    typeof index.sourcesKey === 'string' &&
    Array.isArray(index.blocks) &&
    index.blocks.every(
      (block) =>
        block &&
        typeof block.name === 'string' &&
        Number.isInteger(block.chunkCount) &&
        block.chunkCount >= 0 &&
        Number.isInteger(block.count) &&
        block.count >= 0,
    )
  );
}

async function readIndex(): Promise<RecitersIndex | null> {
  try {
    const stored = await AsyncStorage.getItem(INDEX_KEY);
    if (!stored) return null;
    const index: unknown = JSON.parse(stored);
    return isValidIndex(index) ? index : null;
  } catch {
    return null;
  }
}

function isFresh(index: RecitersIndex, lang: 'ar' | 'en'): boolean {
  return index.lang === lang && Date.now() - index.timestamp <= CACHE_TTL_MS;
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
    const index = await readIndex();
    if (!index || !isFresh(index, lang)) return null;

    const sources: Record<string, Reciter[]> = {};
    const data: Reciter[] = [];

    for (const block of index.blocks) {
      const reciters: Reciter[] = [];
      for (let i = 0; i < block.chunkCount; i += 1) {
        const stored = await AsyncStorage.getItem(chunkKey(block.name, i));
        if (!stored) return null;
        const chunk: unknown = JSON.parse(stored);
        if (!Array.isArray(chunk)) return null;
        reciters.push(...chunk);
      }
      if (reciters.length !== block.count) return null;

      sources[block.name] = reciters;
      data.push(...reciters);
    }

    return {
      data,
      sources,
      sourcesKey: index.sourcesKey,
      timestamp: index.timestamp,
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
    const previous = await readIndex();
    const previousKeys = previous
      ? previous.blocks.flatMap((block) =>
          Array.from({ length: block.chunkCount }, (_, i) =>
            chunkKey(block.name, i),
          ),
        )
      : [];

    const blocks: IndexedSource[] = [];
    const nextKeys: string[] = [];

    for (const [name, reciters] of Object.entries(sources)) {
      const chunks = chunkReciters(reciters);
      for (let i = 0; i < chunks.length; i += 1) {
        const key = chunkKey(name, i);
        await AsyncStorage.setItem(key, JSON.stringify(chunks[i]));
        nextKeys.push(key);
      }
      blocks.push({ name, chunkCount: chunks.length, count: reciters.length });
    }

    // Written last: the index is the commit point for the chunk rows above.
    const index: RecitersIndex = {
      version: 1,
      sourcesKey: Object.keys(sources).sort().join('|'),
      timestamp: Date.now(),
      lang,
      blocks,
    };
    await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(index));

    // A smaller refresh must not leave orphaned chunk rows from the old catalog.
    for (const key of previousKeys) {
      if (!nextKeys.includes(key)) {
        await AsyncStorage.removeItem(key);
      }
    }
  } catch {}

  // Best-effort legacy cleanup; the old single-row key is never read.
  try {
    await AsyncStorage.removeItem(LEGACY_CACHE_KEY);
  } catch {}
}

export async function getRecitersCacheTimestamp(): Promise<number | null> {
  try {
    const index = await readIndex();
    return index ? index.timestamp : null;
  } catch {
    return null;
  }
}

export async function clearRecitersCache(): Promise<void> {
  try {
    const index = await readIndex();
    if (index) {
      for (const block of index.blocks) {
        for (let i = 0; i < block.chunkCount; i += 1) {
          await AsyncStorage.removeItem(chunkKey(block.name, i));
        }
      }
    }
    await AsyncStorage.removeItem(INDEX_KEY);
  } catch {}

  // Best-effort legacy cleanup; the old single-row key is never read.
  try {
    await AsyncStorage.removeItem(LEGACY_CACHE_KEY);
  } catch {}
}
