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
const inFlightFetches = new Map<string, Promise<Reciter[]>>();

function getSourcesSignature(enabledSources?: Record<string, boolean>): string {
  if (!enabledSources) return 'all';
  return Object.keys(enabledSources)
    .sort()
    .map((source) => `${source}:${enabledSources[source] !== false}`)
    .join('|');
}

/**
 * Public API – DO NOT CHANGE SIGNATURE
 */
export function getAllReciters(
  lang: 'ar' | 'en',
  enabledSources?: Record<string, boolean>,
  signal?: AbortSignal,
): Promise<Reciter[]> {
  const key = `${lang}:${getSourcesSignature(enabledSources)}`;

  const existing = inFlightFetches.get(key);
  if (existing) return existing;

  const promise = fetchAllReciters(lang, enabledSources, signal);
  inFlightFetches.set(key, promise);
  promise.finally(() => {
    if (inFlightFetches.get(key) === promise) {
      inFlightFetches.delete(key);
    }
  });
  return promise;
}

async function fetchAllReciters(
  lang: 'ar' | 'en',
  enabledSources?: Record<string, boolean>,
  signal?: AbortSignal,
): Promise<Reciter[]> {
  const sourcesToFetch = RECITER_SOURCES.filter(
    (source) => !enabledSources || enabledSources[source.source] !== false,
  );

  const results = await Promise.allSettled(
    sourcesToFetch.map(async (source) => {
      try {
        const reciters = await source.getReciters(lang, signal);
        return reciters;
      } catch {
        return [];
      }
    }),
  );

  // Filter out rejected promises and flatten successful results
  const successfulResults = results
    .filter(
      (result): result is PromiseFulfilledResult<Reciter[]> =>
        result.status === 'fulfilled',
    )
    .map((result) => result.value);

  return successfulResults.flat();
}
