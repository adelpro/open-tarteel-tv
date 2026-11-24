import { describe, expect, it } from 'vitest';

import { buildHomeGridKey } from './home-grid-key';

describe('buildHomeGridKey', () => {
  it('encodes direction and column count', () => {
    expect(buildHomeGridKey(true, 3)).toBe('grid:rtl:3');
    expect(buildHomeGridKey(false, 3)).toBe('grid:ltr:3');
  });

  it('changes when the column count changes', () => {
    expect(buildHomeGridKey(true, 3)).not.toBe(buildHomeGridKey(true, 4));
  });
});
