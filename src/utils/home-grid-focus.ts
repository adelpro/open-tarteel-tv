/**
 * Pure helpers for keeping TV focus valid in the Home virtualized grid.
 *
 * These depend only on their inputs — no React, navigation or Expo imports —
 * so they can decide focus across remounts, search transitions and data
 * shrinking without touching component state.
 */

export type GridFocusInput = {
  searchFocused: boolean;
  justLeftSearch: boolean;
  dataReady: boolean;
  itemCount: number;
  currentIndex: number;
};

export type GridFocusDecision = {
  focusIndex: number | null;
};

/** Clamp `index` into `[0, length - 1]`, or return 0 for an empty range. */
export const clampGridIndex = (index: number, length: number): number => {
  if (length <= 0) {
    return 0;
  }
  return Math.min(Math.max(index, 0), length - 1);
};

/**
 * Decide which grid index (if any) should hold focus given a state snapshot.
 *
 * Priority: an active search takes focus away from the grid; without ready,
 * non-empty data there is nothing to focus; leaving search resets to the first
 * item; otherwise the current index is kept, clamped to the available range.
 */
export const resolveGridFocus = ({
  searchFocused,
  justLeftSearch,
  dataReady,
  itemCount,
  currentIndex,
}: GridFocusInput): GridFocusDecision => {
  if (searchFocused) {
    return { focusIndex: null };
  }

  if (!dataReady || itemCount <= 0) {
    return { focusIndex: null };
  }

  if (justLeftSearch) {
    return { focusIndex: 0 };
  }

  return { focusIndex: clampGridIndex(currentIndex, itemCount) };
};
