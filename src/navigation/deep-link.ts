/**
 * Pure deep-link helpers. Kept in their own module so the URL scheme and the
 * param parsing can be unit-tested without a React Native or component harness.
 */

// `app.json` declares `opentarteeltv` as the Expo scheme, so that is the scheme
// the installed APK registers in its intent filter. Keep `opentarteel` as an
// additional prefix so links generated from older docs/clients are still
// understood when the OS can deliver them.
export const LINKING_PREFIXES: string[] = [
  'opentarteeltv://',
  'opentarteel://',
];

/**
 * Reciter ids are strings produced by the adapters (e.g. `mp3quran-21193-10913`).
 * Coercing them with Number() turns every real id into NaN, so pass them
 * through untouched. `findReciterById` compares ids via String().
 */
export const parseReciterIdParam = (value?: string): string | undefined =>
  value ? value : undefined;

/** Surah ids, unlike reciter ids, really are numeric. Reject non-numeric junk
 * instead of passing NaN as an explicit surah selection to the player. */
export const parseSurahIdParam = (value?: string): number | undefined => {
  if (!value) return undefined;
  const surahId = Number(value);
  return Number.isFinite(surahId) ? surahId : undefined;
};
