import { getMp3QuranV4Config } from '../config/providers';
import type { LinkSource, Playlist, Reciter } from '../types';
import { ItqanAdapter } from './reciters/itqan.adapter';
import { Mp3QuranV4Adapter } from './reciters/mp3quran-v4.adapter';
import { Mp3QuranAdapter } from './reciters/mp3quran.adapter';
import { QuranAiAdapter } from './reciters/quranai.adapter';
import { QuranFoundationAdapter } from './reciters/quranfoundation.adapter';
import type { ReciterSource } from './reciters/reciter-source';

/**
 * Register all reciter sources here.
 * Adding a new API = add a new adapter to this array.
 */
const RECITER_SOURCES: readonly ReciterSource[] = [
  Mp3QuranAdapter,
  ItqanAdapter,
  QuranAiAdapter,
  QuranFoundationAdapter,
  ...(getMp3QuranV4Config().enabled ? [Mp3QuranV4Adapter] : []),
];

/**
 * In-flight fetch dedupe: Home and Search both mount HomeScreen, so concurrent
 * identical loads (same lang + sources) share one network request.
 */
const inFlightFetches = new Map<string, Promise<ReciterSourceResult[]>>();

export type ReciterSourceResult = {
  source: string;
  reciters: Reciter[];
  error?: string;
};

/** Number of sources that failed, so the UI can warn once regardless of how
 * many catalogs came back empty for legitimate reasons. */
export function getSourceErrorCount(results: ReciterSourceResult[]): number {
  return results.reduce((count, result) => count + (result.error ? 1 : 0), 0);
}

function getSourcesSignature(enabledSources?: Record<string, boolean>): string {
  if (!enabledSources) return 'all';
  return Object.keys(enabledSources)
    .sort()
    .map((source) => `${source}:${enabledSources[source] !== false}`)
    .join('|');
}

/**
 * Fetch reciters split per source. A source that fails yields an empty
 * `reciters` array plus an `error` message, so callers can both merge with
 * previously cached data and tell a failure apart from an empty catalog.
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
      } catch (error) {
        return {
          source: source.source,
          reciters: [],
          error: error instanceof Error ? error.message : String(error),
        };
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

/**
 * Dispatch a lazy playlist request to the adapter registered for `source`.
 * Returns null when the source has no getPlaylist; failures from the adapter
 * are propagated so the player can show its error/retry UI.
 */
export async function getReciterPlaylist(
  source: LinkSource,
  reciter: Reciter,
  lang: 'ar' | 'en',
  signal?: AbortSignal,
): Promise<Playlist | null> {
  const adapter = RECITER_SOURCES.find((item) => item.source === source);
  if (!adapter?.getPlaylist) return null;
  return adapter.getPlaylist(reciter, lang, signal);
}
