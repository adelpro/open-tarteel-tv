import Fuse, { type IFuseOptions } from 'fuse.js';

import type { Reciter } from '../types';
import { normalizeSearchText, type SearchLanguage } from './search';

export type ReciterSearchLanguage = SearchLanguage;

/**
 * A reciter plus the normalized strings the search index matches against.
 * `searchName` / `searchMoshafName` are never rendered - they only exist so
 * Fuse can compare a normalized query with a normalized reciter name.
 */
export type ReciterSearchItem = Reciter & {
  searchName: string;
  searchMoshafName: string;
};

type IndexEntry = {
  index: Fuse<ReciterSearchItem>;
  /** The exact list the index was built from, returned untouched for an empty query. */
  reciters: Reciter[];
  /** Maps a normalized search item back to the reciter object it was built from. */
  originalByItem: Map<ReciterSearchItem, Reciter>;
};

/**
 * Fuse options are part of the search contract of the home screen and must
 * not drift: fuzzy threshold, location-independent matching and the
 * name/moshaf-name weighting.
 */
const FUSE_OPTIONS: IFuseOptions<ReciterSearchItem> = {
  keys: [
    { name: 'searchName', weight: 0.6 },
    { name: 'searchMoshafName', weight: 0.4 },
  ],
  threshold: 0.4,
  ignoreLocation: true,
  minMatchCharLength: 1,
};

/**
 * One index per (reciters array, language) pair. The reciters array is the
 * WeakMap key, so a new catalog (or a new language) invalidates the index and
 * a dropped catalog releases it.
 */
const entryByReciters = new WeakMap<
  Reciter[],
  Map<ReciterSearchLanguage, IndexEntry>
>();
/** Reverse lookup so `searchReciters` can recover the original reciters. */
const entryByIndex = new WeakMap<Fuse<ReciterSearchItem>, IndexEntry>();

/**
 * Builds the Fuse index for a reciter list, or returns the already built one
 * when the same list and language were seen before.
 */
export function buildReciterSearchIndex(
  reciters: Reciter[],
  lang: ReciterSearchLanguage,
): Fuse<ReciterSearchItem> {
  const byLang = entryByReciters.get(reciters);
  const cached = byLang?.get(lang);
  if (cached) {
    return cached.index;
  }

  const items: ReciterSearchItem[] = [];
  const originalByItem = new Map<ReciterSearchItem, Reciter>();
  reciters.forEach((reciter) => {
    const item: ReciterSearchItem = {
      ...reciter,
      searchName: normalizeSearchText(reciter.name, lang),
      searchMoshafName: normalizeSearchText(reciter.moshaf.name, lang),
    };
    items.push(item);
    originalByItem.set(item, reciter);
  });

  const index = new Fuse<ReciterSearchItem>(items, FUSE_OPTIONS);
  const entry: IndexEntry = { index, reciters, originalByItem };
  entryByIndex.set(index, entry);
  if (byLang) {
    byLang.set(lang, entry);
  } else {
    entryByReciters.set(reciters, new Map([[lang, entry]]));
  }
  return index;
}

/**
 * Searches the index. An empty (after normalization) query returns the input
 * list unchanged - the caller still applies its own riwaya/letter filters and
 * alphabetical sort. A non-empty query returns the matching reciters in
 * relevance order.
 */
export function searchReciters(
  index: Fuse<ReciterSearchItem>,
  query: string,
  lang: ReciterSearchLanguage,
): Reciter[] {
  const entry = entryByIndex.get(index);
  const normalizedQuery = normalizeSearchText(query, lang);

  if (!normalizedQuery.length) {
    return entry ? entry.reciters : [];
  }

  return index.search(normalizedQuery).map((result) => {
    return entry?.originalByItem.get(result.item) ?? result.item;
  });
}
