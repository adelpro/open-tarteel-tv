/**
 * Build the identity key for the Home virtualized grid.
 *
 * The grid remounts when its measured header height, text direction or column
 * count changes so the library recalculates its row layout. Callers restore
 * focus after such a remount using the previously focused index.
 */
export const buildHomeGridKey = (
  headerHeight: number,
  isRTL: boolean,
  cardsPerRow: number,
): string => `grid:${headerHeight}:${isRTL ? 'rtl' : 'ltr'}:${cardsPerRow}`;
