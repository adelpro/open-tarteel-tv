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
  /*  ItqanAdapter, */
];

/**
 * Public API – DO NOT CHANGE SIGNATURE
 */
export async function getAllReciters(lang: "ar" | "en"): Promise<Reciter[]> {
  const results = await Promise.all(
    RECITER_SOURCES.map((source) => source.getReciters(lang))
  );

  return results.flat();
}
