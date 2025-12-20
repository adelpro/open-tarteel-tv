import { useMemo } from "react";
import { Reciter } from "../types";

export function useReciterGridLayout(
  filteredReciters: Reciter[],
  width: number
) {
  const cardsPerRow = useMemo(() => {
    if (width >= 2800) return 6;
    if (width >= 2200) return 5;
    if (width >= 1600) return 4;
    return 3;
  }, [width]);

  const itemWidth = useMemo(() => {
    const contentPadding = 20;
    const rowPadding = 20;
    const rowGap = 12;
    const available = width - contentPadding * 2 - rowPadding * 2;
    const gutters = rowGap * (cardsPerRow - 1);
    const w = (available - gutters) / cardsPerRow;
    return w > 0 ? Math.floor(w) : 0;
  }, [width, cardsPerRow]);

  const reciterRows = useMemo(() => {
    const rows: Reciter[][] = [];
    filteredReciters.forEach((reciter, index) => {
      const rowIndex = Math.floor(index / cardsPerRow);
      if (!rows[rowIndex]) {
        rows[rowIndex] = [];
      }
      rows[rowIndex].push(reciter);
    });
    return rows;
  }, [filteredReciters, cardsPerRow]);

  return { cardsPerRow, itemWidth, reciterRows };
}
