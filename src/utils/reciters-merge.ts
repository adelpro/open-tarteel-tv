import type { ReciterSourceResult } from '../services/api';
import type { Reciter } from '../types';

export type MergedReciters = {
  /** Per-source catalogs, keyed by source name. */
  mergedSources: Record<string, Reciter[]>;
  /** Every merged source flattened into a single list. */
  merged: Reciter[];
};

/**
 * Merge freshly fetched catalogs with the cached ones.
 *
 * A source that returned reciters wins; a source that returned nothing keeps
 * whatever was cached for it (a temporary outage must not erase a catalog).
 * Sources that were not fetched at all are absent from the result.
 */
export function mergeRecitersBySource(
  results: ReciterSourceResult[],
  cachedSources: Record<string, Reciter[]>,
): MergedReciters {
  const mergedSources: Record<string, Reciter[]> = {};

  for (const result of results) {
    mergedSources[result.source] =
      result.reciters.length > 0
        ? result.reciters
        : (cachedSources[result.source] ?? []);
  }

  const merged = Object.values(mergedSources).flat();

  return { mergedSources, merged };
}
