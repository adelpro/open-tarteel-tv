import { describe, expect, it, vi } from 'vitest';

import { formatPlaybackTime } from './player-progress';

// This suite only exercises the pure time formatter; stub out the React Native
// and audio sides of the import graph so no rendering or native module parsing
// is required. Vitest hoists vi.mock above imports, so placement here still
// intercepts them.
vi.mock('react-native', () => ({
  StyleSheet: { create: (styles: unknown) => styles },
  Text: 'Text',
  View: 'View',
}));
vi.mock('expo-audio', () => ({
  useAudioPlayerStatus: () => ({
    currentTime: 0,
    duration: 0,
    playing: false,
    didJustFinish: false,
  }),
}));
vi.mock('../context/settings.context', () => ({
  useSettings: () => ({ isDark: true, keepScreenAwake: false }),
}));

describe('formatPlaybackTime', () => {
  it('formats a duration in seconds as m:ss', () => {
    expect(formatPlaybackTime(65)).toBe('01:05');
  });

  it('formats zero as 00:00', () => {
    expect(formatPlaybackTime(0)).toBe('00:00');
  });
});
