import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { clearCache } from '../services/audio-cache';
import { clearItqanPlaylistCache } from '../services/reciters/itqan-playlist-cache';
import { resetQuranFoundationCache } from '../services/reciters/quranfoundation.adapter';
import { clearRecitersCache } from '../services/reciters-cache';
import { LinkSource } from '../types';
import {
  migrateEnabledSources,
  SETTINGS_MIGRATION_VERSION,
} from '../utils/settings-migration';

const SETTINGS_STORAGE_KEY = '@open_tarteel_settings';
const SETTINGS_VERSION_STORAGE_KEY = '@open_tarteel_settings_version';
const THEME_STORAGE_KEY = '@open_tarteel_theme';
const KEEP_AWAKE_STORAGE_KEY = '@open_tarteel_keep_awake';

// Typed as Record<LinkSource, …> so a newly added source cannot be forgotten
// here without a compile error. MP3Quran v4 stays opt-in because its upstream
// is staging; the feature flag is what decides whether it is shown at all.
const DEFAULT_ENABLED_SOURCES: Record<LinkSource, boolean> = {
  [LinkSource.MP3QURAN]: true,
  [LinkSource.ITQAN]: true,
  [LinkSource.QURANAI]: true,
  [LinkSource.QURAN_FOUNDATION]: true,
  [LinkSource.MP3QURAN_V4]: false,
};

export type ThemeMode = 'system' | 'light' | 'dark';

type SettingsContextValue = {
  enabledSources: Record<string, boolean>;
  isSourceEnabled: (source: string) => boolean;
  toggleSource: (source: string) => Promise<void>;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
  keepScreenAwake: boolean;
  toggleKeepScreenAwake: () => void;
  cacheEpoch: number;
  clearCaches: () => Promise<void>;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();

  const [enabledSources, setEnabledSources] = useState<Record<string, boolean>>(
    DEFAULT_ENABLED_SOURCES,
  );
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [keepScreenAwake, setKeepScreenAwake] = useState<boolean>(true);
  const [cacheEpoch, setCacheEpoch] = useState(0);

  /* load once */
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(SETTINGS_STORAGE_KEY),
      AsyncStorage.getItem(SETTINGS_VERSION_STORAGE_KEY),
    ])
      .then(([stored, storedVersion]) => {
        const parsedJson = stored ? JSON.parse(stored) : null;
        const parsed: Record<string, unknown> =
          parsedJson !== null &&
          typeof parsedJson === 'object' &&
          !Array.isArray(parsedJson)
            ? (parsedJson as Record<string, unknown>)
            : {};

        const rawVersion =
          storedVersion !== null && storedVersion.trim() !== ''
            ? Number(storedVersion)
            : undefined;
        const version =
          rawVersion !== undefined && !Number.isNaN(rawVersion)
            ? rawVersion
            : undefined;

        const migrated = migrateEnabledSources(parsed, version);

        // Merge with defaults so newly added sources are still handled.
        setEnabledSources((prev) => ({ ...prev, ...migrated.enabledSources }));

        // Persist the migrated toggles so the fix is durable: otherwise the
        // untouched stale value would be re-merged on the next launch, when
        // the version is already 2 and migration no longer runs.
        if (version === undefined || version < SETTINGS_MIGRATION_VERSION) {
          AsyncStorage.setItem(
            SETTINGS_STORAGE_KEY,
            JSON.stringify(migrated.enabledSources),
          ).catch(() => {});
        }
        // Write the schema version exactly once per load.
        AsyncStorage.setItem(
          SETTINGS_VERSION_STORAGE_KEY,
          String(migrated.version),
        ).catch(() => {});
      })
      .catch(() => {});

    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((stored) => {
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setThemeModeState(stored);
        }
      })
      .catch(() => {});

    AsyncStorage.getItem(KEEP_AWAKE_STORAGE_KEY)
      .then((stored) => {
        if (stored !== null) {
          setKeepScreenAwake(stored === 'true');
        }
      })
      .catch(() => {});
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch(() => {});
  }, []);

  const toggleKeepScreenAwake = useCallback(() => {
    setKeepScreenAwake((prev) => {
      const newValue = !prev;
      AsyncStorage.setItem(KEEP_AWAKE_STORAGE_KEY, String(newValue)).catch(
        () => {},
      );
      return newValue;
    });
  }, []);

  const isDark =
    themeMode === 'system'
      ? systemColorScheme !== 'light'
      : themeMode === 'dark';

  const isSourceEnabled = useCallback(
    (source: string) => {
      // If key doesn't exist, default to true
      return enabledSources[source] !== false;
    },
    [enabledSources],
  );

  const toggleSource = useCallback(async (source: string) => {
    setEnabledSources((prev) => {
      const current = prev[source] !== false;

      // Guard: If trying to disable, ensure at least one source remains enabled
      if (current) {
        const enabledCount = Object.values(prev).filter(
          (v) => v !== false,
        ).length;
        if (enabledCount <= 1) {
          return prev;
        }
      }

      const updated = { ...prev, [source]: !current };
      AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearCaches = useCallback(async () => {
    resetQuranFoundationCache();
    await Promise.all([
      clearRecitersCache(),
      clearItqanPlaylistCache(),
      clearCache(),
    ]);
    // Bump the epoch so mounted screens (e.g. Home) refetch immediately.
    setCacheEpoch((prev) => prev + 1);
  }, []);

  const contextValue = useMemo(
    () => ({
      enabledSources,
      isSourceEnabled,
      toggleSource,
      themeMode,
      setThemeMode,
      isDark,
      keepScreenAwake,
      toggleKeepScreenAwake,
      cacheEpoch,
      clearCaches,
    }),
    [
      enabledSources,
      isSourceEnabled,
      toggleSource,
      themeMode,
      setThemeMode,
      isDark,
      keepScreenAwake,
      toggleKeepScreenAwake,
      cacheEpoch,
      clearCaches,
    ],
  );

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}

/* hook */
export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return ctx;
}
