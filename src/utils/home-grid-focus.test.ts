import { describe, expect, it } from 'vitest';

import {
  cardIndexToGridRow,
  clampGridIndex,
  type GridRowFocusInput,
  gridRowToCardIndex,
  resolveGridFocus,
  resolveGridRowFocus,
} from './home-grid-focus';

const makeInput = (
  overrides: Partial<GridRowFocusInput> = {},
): GridRowFocusInput => ({
  searchFocused: false,
  justLeftSearch: false,
  dataReady: true,
  itemCount: 40,
  currentIndex: 6,
  hasHeader: true,
  ...overrides,
});

describe('clampGridIndex', () => {
  it('clamps an index above the range to the last item', () => {
    expect(clampGridIndex(7, 3)).toBe(2);
  });

  it('clamps a negative index to zero', () => {
    expect(clampGridIndex(-1, 3)).toBe(0);
  });

  it('returns zero for an empty range', () => {
    expect(clampGridIndex(0, 0)).toBe(0);
  });
});

describe('resolveGridFocus', () => {
  it('returns null while the search field is focused', () => {
    expect(resolveGridFocus(makeInput({ searchFocused: true }))).toEqual({
      focusIndex: null,
    });
  });

  it('focuses the first item after leaving search when data is ready', () => {
    expect(
      resolveGridFocus(
        makeInput({ justLeftSearch: true, currentIndex: 9, itemCount: 40 }),
      ),
    ).toEqual({ focusIndex: 0 });
  });

  it('returns null while data is not ready', () => {
    expect(resolveGridFocus(makeInput({ dataReady: false }))).toEqual({
      focusIndex: null,
    });
  });

  it('returns null when there are no items', () => {
    expect(resolveGridFocus(makeInput({ itemCount: 0 }))).toEqual({
      focusIndex: null,
    });
  });

  it('clamps a stale index after the data shrinks', () => {
    expect(
      resolveGridFocus(makeInput({ currentIndex: 9, itemCount: 4 })),
    ).toEqual({ focusIndex: 3 });
  });

  it('keeps a valid index when the data is stable', () => {
    expect(
      resolveGridFocus(makeInput({ currentIndex: 6, itemCount: 40 })),
    ).toEqual({ focusIndex: 6 });
  });
});

describe('cardIndexToGridRow', () => {
  it('maps the first card to row 1 when a header is present', () => {
    expect(cardIndexToGridRow(0, true)).toBe(1);
  });

  it('maps the first card to row 0 without a header', () => {
    expect(cardIndexToGridRow(0, false)).toBe(0);
  });

  it('maps the last card to the last row when a header is present', () => {
    const cardCount = 40;
    expect(cardIndexToGridRow(cardCount - 1, true)).toBe(cardCount);
  });
});

describe('gridRowToCardIndex', () => {
  it('maps the first card row back to card 0', () => {
    expect(gridRowToCardIndex(1, true)).toBe(0);
  });

  it('maps the header row to card 0 instead of a negative index', () => {
    expect(gridRowToCardIndex(0, true)).toBe(0);
  });

  it('maps row 0 to card 0 without a header', () => {
    expect(gridRowToCardIndex(0, false)).toBe(0);
  });
});

describe('resolveGridRowFocus', () => {
  it('translates the search-exit focus to the first card row', () => {
    expect(
      resolveGridRowFocus(
        makeInput({ justLeftSearch: true, currentIndex: 9, hasHeader: true }),
      ),
    ).toEqual({ focusRow: 1 });
  });

  it('returns no focus row for an empty catalog', () => {
    expect(
      resolveGridRowFocus(makeInput({ itemCount: 0, hasHeader: true })),
    ).toEqual({ focusRow: null });
  });

  it('keeps the decision in card space before translating', () => {
    expect(
      resolveGridRowFocus(
        makeInput({ currentIndex: 6, itemCount: 40, hasHeader: true }),
      ),
    ).toEqual({ focusRow: 7 });
  });

  it('translates to row 0 without a header', () => {
    expect(
      resolveGridRowFocus(
        makeInput({ justLeftSearch: true, hasHeader: false }),
      ),
    ).toEqual({ focusRow: 0 });
  });
});
