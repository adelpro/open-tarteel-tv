import type { Reciter } from "../types";
import { ItqanAdapter } from "./reciters/itqan.adapter";

import { Mp3QuranAdapter } from "./reciters/mp3quran.adapter";
import type { ReciterSource } from "./reciters/reciter-source";

/**
 * Register all reciter sources here.
 * Adding a new API = add a new adapter to this array.
 */
const RECITER_SOURCES: readonly ReciterSource[] = [
  Mp3QuranAdapter,
  ItqanAdapter,
];

/**
 * Public API – DO NOT CHANGE SIGNATURE
 */
export async function getAllReciters(
  lang: "ar" | "en",
  enabledSources?: Record<string, boolean>,
): Promise<Reciter[]> {
  const sourcesToFetch = RECITER_SOURCES.filter(
    (source) => !enabledSources || enabledSources[source.source] !== false,
  );

  const results = await Promise.allSettled(
    sourcesToFetch.map(async (source) => {
      try {
        const reciters = await source.getReciters(lang);
        return reciters;
      } catch (error) {
        return [];
      }
    }),
  );

  // Filter out rejected promises and flatten successful results
  const successfulResults = results
    .filter(
      (result): result is PromiseFulfilledResult<Reciter[]> =>
        result.status === "fulfilled",
    )
    .map((result) => result.value);

  return successfulResults.flat();
}
