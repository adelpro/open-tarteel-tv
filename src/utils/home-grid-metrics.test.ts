import { describe, expect, it } from 'vitest';

import { getVirtualGridRowHeight } from './home-grid-metrics';

describe('getVirtualGridRowHeight', () => {
  it('uses the row height, not the card height, for SpatialNavigationVirtualizedGrid', () => {
    expect(getVirtualGridRowHeight(110, 220)).toBe(220);
  });

  it('keeps the row height when card and row heights differ on wide screens', () => {
    expect(getVirtualGridRowHeight(140, 260)).toBe(260);
  });
});
