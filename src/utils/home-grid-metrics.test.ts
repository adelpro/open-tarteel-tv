import { describe, expect, it } from 'vitest';

import {
  getVirtualGridRowContainerStyle,
  getVirtualGridRowHeight,
} from './home-grid-metrics';

describe('getVirtualGridRowHeight', () => {
  it('adds a small focus buffer to the card height', () => {
    expect(getVirtualGridRowHeight(110)).toBe(121);
  });

  it('scales with the card height on wide screens', () => {
    expect(getVirtualGridRowHeight(140)).toBe(154);
  });
});

describe('getVirtualGridRowContainerStyle', () => {
  it('flips row order for Arabic and spreads cards across the full width', () => {
    expect(getVirtualGridRowContainerStyle(true)).toEqual({
      direction: 'rtl',
      width: '100%',
      justifyContent: 'space-between',
    });
    expect(getVirtualGridRowContainerStyle(false)).toEqual({
      direction: 'ltr',
      width: '100%',
      justifyContent: 'space-between',
    });
  });
});
