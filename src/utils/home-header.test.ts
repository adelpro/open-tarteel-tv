import { describe, expect, it } from 'vitest';

import { normalizeHeaderHeight } from './home-header';

describe('normalizeHeaderHeight', () => {
  it('keeps zero at zero', () => {
    expect(normalizeHeaderHeight(0)).toBe(0);
  });

  it('clamps a negative height to zero', () => {
    expect(normalizeHeaderHeight(-5)).toBe(0);
  });

  it('passes a positive measured height through unchanged', () => {
    expect(normalizeHeaderHeight(312.5)).toBe(312.5);
  });

  it('maps NaN to a finite zero', () => {
    const result = normalizeHeaderHeight(NaN);
    expect(Number.isFinite(result)).toBe(true);
    expect(result).toBe(0);
  });
});
