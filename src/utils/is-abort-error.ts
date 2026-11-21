/**
 * Abort detection that works for both `Error` and `DOMException`.
 *
 * React Native / Hermes may reject a fetch with a `DOMException` whose
 * `name === 'AbortError'` but which is NOT an `instanceof Error`. Keying on the
 * `name` property alone avoids false "sources unavailable" warnings in that
 * case, while still treating a genuine abort as a cancelled (not failed) load.
 */
export const isAbortError = (error: unknown): boolean =>
  (error as { name?: unknown } | null | undefined)?.name === 'AbortError';
