/**
 * Build the identity key for the Home virtualized grid.
 *
 * The header now lives outside the grid, so the grid only remounts when its
 * text direction or column count changes. Callers restore focus after such a
 * remount using the previously focused index.
 */
export const buildHomeGridKey = (isRTL: boolean, cardsPerRow: number): string =>
  `grid:${isRTL ? 'rtl' : 'ltr'}:${cardsPerRow}`;
