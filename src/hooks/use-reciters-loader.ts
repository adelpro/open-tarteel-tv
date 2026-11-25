import { useCallback, useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';

import { fetchRecitersBySource, getSourceErrorCount } from '../services/api';
import {
  getCachedRecitersInfo,
  setCachedReciters,
  SOFT_CACHE_TTL_MS,
} from '../services/reciters-cache';
import type { Reciter } from '../types';
import { isAbortError } from '../utils/is-abort-error';
import { mergeRecitersBySource } from '../utils/reciters-merge';

export type RecitersLoaderState = {
  reciters: Reciter[];
  loading: boolean;
  error: string | null;
  sourceErrorCount: number;
  loadReciters: (lang: 'ar' | 'en') => Promise<void>;
};

/**
 * Owns the reciter loading lifecycle: cache-first read, background refresh,
 * per-source merge with the cached catalogs, and the request guards that keep
 * a superseded or unmounted load from writing state.
 *
 * The loading logic lives here — and not in the screen — so the screen stays
 * compilable by the React Compiler, which cannot lower a try/catch that holds
 * value blocks.
 */
export function useRecitersLoader(
  enabledSourcesRef: MutableRefObject<Record<string, boolean>>,
): RecitersLoaderState {
  const [reciters, setReciters] = useState<Reciter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceErrorCount, setSourceErrorCount] = useState(0);

  // Guards against stale responses racing each other (fast language switches,
  // rapid retries) and cancels in-flight HTTP on unmount.
  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  // The enabled sources are read through the ref instead of being re-created
  // here, so the loader identity only changes if the caller passes a
  // different ref object (a `useRef` result never changes).
  const loadReciters = useCallback(
    async (lang: 'ar' | 'en') => {
      const requestId = ++requestIdRef.current;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      // Compiler-compatible replacement for the old `finally` clause: every
      // exit path below funnels through this guard so the loading flag is
      // cleared exactly once for the current request.
      const finish = () => {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      };

      setLoading(true);
      setError(null);
      setSourceErrorCount(0);
      try {
        const cached = await getCachedRecitersInfo(lang);
        if (requestId !== requestIdRef.current) {
          finish();
          return;
        }

        // Serve cached data instantly.
        if (cached && cached.data.length > 0) {
          setReciters(cached.data);
          setLoading(false);

          // Fresh cache + same enabled sources -> skip the background refresh.
          const currentSourcesKey = Object.keys(enabledSourcesRef.current)
            .sort()
            .join('|');
          if (
            cached.sourcesKey === currentSourcesKey &&
            Date.now() - cached.timestamp < SOFT_CACHE_TTL_MS
          ) {
            finish();
            return;
          }
        }

        const sourceResults = await fetchRecitersBySource(
          lang,
          enabledSourcesRef.current,
          controller.signal,
        );
        if (requestId !== requestIdRef.current) {
          finish();
          return;
        }
        setSourceErrorCount(getSourceErrorCount(sourceResults));

        // Merge: a source that returned empty keeps its previously cached
        // reciters (e.g. a temporary outage) instead of vanishing.
        const cachedSources = cached?.sources ?? {};
        const { mergedSources, merged } = mergeRecitersBySource(
          sourceResults,
          cachedSources,
        );

        setReciters(merged);

        // Never overwrite the cache with an empty result.
        if (merged.length > 0) {
          await setCachedReciters(mergedSources, lang);
        }
      } catch (err) {
        if (requestId !== requestIdRef.current) {
          finish();
          return;
        }
        // Aborts (superseded/unmounted) are not real failures.
        if (isAbortError(err)) {
          finish();
          return;
        }
        setSourceErrorCount(0);

        console.error('Failed to load reciters:', err);
        const errorMsg =
          err instanceof Error
            ? err.message
            : 'Failed to load reciters. Please try again.';
        setError(errorMsg);
        setReciters([]);
      }
      finish();
    },
    [enabledSourcesRef],
  );

  // Cancel any in-flight load when the screen unmounts so stale responses
  // cannot write state afterwards.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      requestIdRef.current += 1;
    };
  }, []);

  return { reciters, loading, error, sourceErrorCount, loadReciters };
}
