/**
 * One-time settings migration for the enabled-sources toggles.
 *
 * Older builds persisted `qurani: false` as a stale default that suppressed
 * the provider even for users who never chose to disable it. At schema version
 * 2 we flip that stale value back on exactly once; a deliberate later choice to
 * disable the source is preserved.
 */

export const SETTINGS_MIGRATION_VERSION = 2;

const QURANI_SOURCE_KEY = 'qurani';

export function migrateEnabledSources(
  stored: Record<string, unknown>,
  version: number | undefined,
): { enabledSources: Record<string, boolean>; version: number } {
  // Keep every stored toggle verbatim; ignore non-boolean noise so the result
  // satisfies Record<string, boolean>.
  const enabledSources: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(stored)) {
    if (typeof value === 'boolean') {
      enabledSources[key] = value;
    }
  }

  const shouldMigrate =
    version === undefined || version < SETTINGS_MIGRATION_VERSION;

  if (shouldMigrate && enabledSources[QURANI_SOURCE_KEY] === false) {
    enabledSources[QURANI_SOURCE_KEY] = true;
  }

  const nextVersion = shouldMigrate
    ? SETTINGS_MIGRATION_VERSION
    : (version ?? SETTINGS_MIGRATION_VERSION);

  return { enabledSources, version: nextVersion };
}
