/**
 * SpatialNavigationVirtualizedGrid sizes each virtual row, not each card.
 * Passing the card height here makes rows overlap on TV.
 */
export const getVirtualGridRowHeight = (
  _cardHeight: number,
  rowHeight: number,
): number => rowHeight;
