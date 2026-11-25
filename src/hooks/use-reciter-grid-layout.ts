import { useMemo } from 'react';

export function useReciterGridLayout(width: number) {
  const cardsPerRow = useMemo(() => {
    if (width >= 2800) return 6;
    if (width >= 2200) return 5;
    if (width >= 1600) return 4;
    return 3;
  }, [width]);

  const itemWidth = useMemo(() => {
    // Screen padding (20) plus the grid row's horizontal focus buffer (12),
    // so scaled cards stay inside the grid's clipping viewport.
    const contentPadding = 32;
    const rowGap = 12;
    const available = width - contentPadding * 2;
    const gutters = rowGap * (cardsPerRow - 1);
    const w = (available - gutters) / cardsPerRow;
    return w > 0 ? Math.floor(w) : 0;
  }, [width, cardsPerRow]);

  return { cardsPerRow, itemWidth };
}
