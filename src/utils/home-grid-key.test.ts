import { describe, expect, it } from 'vitest';

import { buildHomeGridKey } from './home-grid-key';

describe('buildHomeGridKey', () => {
  it('encodes direction and column count', () => {
    expect(buildHomeGridKey(312, true, 3)).toBe('grid:312:rtl:3');
    expect(buildHomeGridKey(312, false, 3)).toBe('grid:312:ltr:3');
  });

  it('changes when only the height changes', () => {
    expect(buildHomeGridKey(312, true, 3)).not.toBe(
      buildHomeGridKey(313, true, 3),
    );
  });
});
