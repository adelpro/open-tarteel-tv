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
  it('uses direction rtl for Arabic and ltr otherwise', () => {
    expect(getVirtualGridRowContainerStyle(true)).toEqual({ direction: 'rtl' });
    expect(getVirtualGridRowContainerStyle(false)).toEqual({
      direction: 'ltr',
    });
  });
});
