/**
 * SpatialNavigationVirtualizedGrid sizes its virtual rows from `itemHeight`.
 * The stride must match the real rendered row (the card plus a small focus
 * buffer), otherwise rows drift and overlap further down the grid. The
 * library's own example uses `cardHeight * 1.1` for exactly this reason.
 */
export const getVirtualGridRowHeight = (cardHeight: number): number =>
  Math.round(cardHeight * 1.1);

/**
 * The library applies its own `flexDirection: 'row'` after this style, so
 * `row-reverse` is ignored — `direction` is what flips the order for RTL.
 * Without a full width and `space-between`, fixed-width cards shrink-wrap to
 * one side instead of being spread evenly across the screen.
 */
export const getVirtualGridRowContainerStyle = (
  isRTL: boolean,
): {
  direction: 'rtl' | 'ltr';
  width: '100%';
  justifyContent: 'space-between';
  paddingHorizontal: number;
} => ({
  direction: isRTL ? 'rtl' : 'ltr',
  width: '100%',
  justifyContent: 'space-between',
  // A focused card scales by 5%, so keep it off the clipping edge of the
  // viewport instead of letting half its border disappear at the sides.
  paddingHorizontal: 12,
});
