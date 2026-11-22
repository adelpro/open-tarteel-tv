import { describe, expect, it } from 'vitest';

import { getPlayerStatusLabel } from './player-label';

describe('getPlayerStatusLabel', () => {
  it('returns now_playing while playing', () => {
    expect(getPlayerStatusLabel(true)).toBe('now_playing');
  });

  it('returns selected_surah while not playing', () => {
    expect(getPlayerStatusLabel(false)).toBe('selected_surah');
  });
});
