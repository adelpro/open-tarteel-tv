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

export type GridRowFocusInput = GridFocusInput & {
  hasHeader: boolean;
};

export type GridRowFocusDecision = {
  focusRow: number | null;
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

/**
 * Convert a card index into the index used by the virtualized grid ref.
 *
 * The library prepends the header as virtual row 0 when a header is supplied,
 * so ref `focus(index)` and `currentlyFocusedItemIndex` are header-inclusive
 * while all the helpers above work in card space. With a header, card 0 lives
 * at row 1 and the last card lives at row `cardCount`; without one, the two
 * spaces are identical.
 */
export const cardIndexToGridRow = (
  cardIndex: number,
  hasHeader: boolean,
): number => cardIndex + (hasHeader ? 1 : 0);

/** Convert a header-inclusive row reported by the ref back into a card index. */
export const gridRowToCardIndex = (
  gridRow: number,
  hasHeader: boolean,
): number => Math.max(gridRow - (hasHeader ? 1 : 0), 0);

/**
 * The grid ref reports a plain number, but a null/undefined/NaN value must
 * never reach gridRowToCardIndex (it would poison focus with NaN). Fall back
 * to row 0 — which is card 0 both with and without a header.
 */
export const toFiniteGridRow = (gridRow: number | null | undefined): number =>
  typeof gridRow === 'number' && Number.isFinite(gridRow) ? gridRow : 0;

export type RemountFocusInput = {
  previousGridKey: string | null;
  gridKey: string;
  /** Card index captured from live focus just before a keyed remount. */
  capturedCardIndex: number;
  /** Header-inclusive row read from the grid ref (null/undefined guarded). */
  liveGridRow: number | null | undefined;
  itemCount: number;
  hasHeader: boolean;
};

export type RemountFocusDecision = {
  isRemount: boolean;
  currentCardIndex: number;
};

/**
 * Decide whether a keyed grid remount happened and which card is focused.
 *
 * A key change destroys the old grid and mounts a fresh one whose ref reports
 * row 0, so on a remount the only trustworthy value is the card index captured
 * from the live focus before unmount. Otherwise the live grid row wins.
 */
export const resolveRemountFocus = ({
  previousGridKey,
  gridKey,
  capturedCardIndex,
  liveGridRow,
  itemCount,
  hasHeader,
}: RemountFocusInput): RemountFocusDecision => {
  const isRemount = previousGridKey !== null && previousGridKey !== gridKey;
  const cardIndex = isRemount
    ? capturedCardIndex
    : gridRowToCardIndex(toFiniteGridRow(liveGridRow), hasHeader);
  return {
    isRemount,
    currentCardIndex: clampGridIndex(cardIndex, itemCount),
  };
};

/**
 * Card-space focus decision translated to a grid row, ready for `ref.focus()`.
 * A `null` row means the caller must not focus the grid (empty data, search
 * focused, or data not ready).
 */
export const resolveGridRowFocus = ({
  hasHeader,
  ...focusInput
}: GridRowFocusInput): GridRowFocusDecision => {
  const { focusIndex } = resolveGridFocus(focusInput);
  if (focusIndex === null) {
    return { focusRow: null };
  }
  return { focusRow: cardIndexToGridRow(focusIndex, hasHeader) };
};
