import { describe, expect, it } from 'vitest';

import { migrateEnabledSources } from './settings-migration';

describe('migrateEnabledSources', () => {
  it('re-enables a stale disabled qurani source on an unversioned settings object', () => {
    const { enabledSources, version } = migrateEnabledSources(
      { qurani: false, itqan: false, mp3quran: true },
      undefined,
    );

    expect(enabledSources.qurani).toBe(true);
    // Other stored toggles are preserved verbatim, including disabled ones.
    expect(enabledSources.itqan).toBe(false);
    expect(enabledSources.mp3quran).toBe(true);
    expect(version).toBe(2);
  });

  it('preserves a later user choice to disable qurani at version 2', () => {
    const { enabledSources, version } = migrateEnabledSources(
      { qurani: false, itqan: true, 'quran-foundation': false },
      2,
    );

    expect(enabledSources.qurani).toBe(false);
    expect(enabledSources.itqan).toBe(true);
    expect(enabledSources['quran-foundation']).toBe(false);
    expect(version).toBe(2);
  });

  it('also re-enables qurani when the stored version predates 2', () => {
    const { enabledSources, version } = migrateEnabledSources(
      { qurani: false, 'mp3quran-v4': false },
      1,
    );

    expect(enabledSources.qurani).toBe(true);
    expect(enabledSources['mp3quran-v4']).toBe(false);
    expect(version).toBe(2);
  });

  it('leaves an already-enabled qurani source untouched', () => {
    const { enabledSources, version } = migrateEnabledSources(
      { qurani: true },
      undefined,
    );

    expect(enabledSources.qurani).toBe(true);
    expect(version).toBe(2);
  });
});
