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
 * `row-reverse` is ignored. Use `direction` to get RTL row layout.
 */
export const getVirtualGridRowContainerStyle = (
  isRTL: boolean,
): { direction: 'rtl' | 'ltr' } => ({
  direction: isRTL ? 'rtl' : 'ltr',
});
