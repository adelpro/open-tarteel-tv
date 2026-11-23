import { describe, expect, it } from 'vitest';

import {
  clampGridIndex,
  type GridFocusInput,
  resolveGridFocus,
} from './home-grid-focus';

const makeInput = (
  overrides: Partial<GridFocusInput> = {},
): GridFocusInput => ({
  searchFocused: false,
  justLeftSearch: false,
  dataReady: true,
  itemCount: 40,
  currentIndex: 6,
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
