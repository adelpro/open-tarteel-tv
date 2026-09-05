import type { Reciter } from '../types';
import { ItqanAdapter } from './reciters/itqan.adapter';
import { Mp3QuranAdapter } from './reciters/mp3quran.adapter';
import type { ReciterSource } from './reciters/reciter-source';

/**
 * Register all reciter sources here.
 * Adding a new API = add a new adapter to this array.
 */
const RECITER_SOURCES: readonly ReciterSource[] = [
  Mp3QuranAdapter,
  ItqanAdapter,
];

/**
 * In-flight fetch dedupe: Home and Search both mount HomeScreen, so concurrent
 * identical loads (same lang + sources) share one network request.
 */
const inFlightFetches = new Map<string, Promise<ReciterSourceResult[]>>();

export type ReciterSourceResult = {
  source: string;
  reciters: Reciter[];
};

function getSourcesSignature(enabledSources?: Record<string, boolean>): string {
  if (!enabledSources) return 'all';
  return Object.keys(enabledSources)
    .sort()
    .map((source) => `${source}:${enabledSources[source] !== false}`)
    .join('|');
}

/**
 * Fetch reciters split per source. A source that fails yields an empty
 * `reciters` array so callers can merge with previously cached data.
 */
export function fetchRecitersBySource(
  lang: 'ar' | 'en',
  enabledSources?: Record<string, boolean>,
  signal?: AbortSignal,
): Promise<ReciterSourceResult[]> {
  const key = `${lang}:${getSourcesSignature(enabledSources)}`;

  const existing = inFlightFetches.get(key);
  if (existing) return existing;

  const promise = doFetchRecitersBySource(lang, enabledSources, signal);
  inFlightFetches.set(key, promise);
  promise.finally(() => {
    if (inFlightFetches.get(key) === promise) {
      inFlightFetches.delete(key);
    }
  });
  return promise;
}

async function doFetchRecitersBySource(
  lang: 'ar' | 'en',
  enabledSources?: Record<string, boolean>,
  signal?: AbortSignal,
): Promise<ReciterSourceResult[]> {
  const sourcesToFetch = RECITER_SOURCES.filter(
    (source) => !enabledSources || enabledSources[source.source] !== false,
  );

  const results = await Promise.all(
    sourcesToFetch.map(async (source) => {
      try {
        const reciters = await source.getReciters(lang, signal);
        return { source: source.source, reciters };
      } catch {
        return { source: source.source, reciters: [] };
      }
    }),
  );

  return results;
}

/**
 * Public API – flattened list of reciters from all enabled sources.
 */
export async function getAllReciters(
  lang: 'ar' | 'en',
  enabledSources?: Record<string, boolean>,
  signal?: AbortSignal,
): Promise<Reciter[]> {
  const results = await fetchRecitersBySource(lang, enabledSources, signal);
  return results.flatMap((result) => result.reciters);
}
