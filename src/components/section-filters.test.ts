import { describe, expect, it, vi } from 'vitest';

import { Riwaya } from '../types';
import { RIWAYA_FILTER_VALUES } from './section-filters';

// This suite only checks a plain constant; stub out the React Native side of
// the import graph so no rendering or native module parsing is required.
// Vitest hoists vi.mock above imports, so placement here still intercepts them.
vi.mock('react-native', () => ({
  StyleSheet: { create: (styles: unknown) => styles },
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('react-tv-space-navigation', () => ({
  SpatialNavigationScrollView: () => null,
  SpatialNavigationView: () => null,
}));
vi.mock('./filter-chip', () => ({ default: () => null }));

describe('RIWAYA_FILTER_VALUES', () => {
  it('contains exactly 13 riwaya values', () => {
    expect(RIWAYA_FILTER_VALUES).toHaveLength(13);
  });

  it('covers every Riwaya enum value', () => {
    expect(RIWAYA_FILTER_VALUES).toEqual(
      expect.arrayContaining(Object.values(Riwaya)),
    );
  });
});
