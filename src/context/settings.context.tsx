import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { LinkSource } from '../types';

const SETTINGS_STORAGE_KEY = '@open_tarteel_settings';
const THEME_STORAGE_KEY = '@open_tarteel_theme';

export type ThemeMode = 'system' | 'light' | 'dark';

type SettingsContextValue = {
  enabledSources: Record<string, boolean>;
  isSourceEnabled: (source: string) => boolean;
  toggleSource: (source: string) => Promise<void>;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();

  // Default source enablement (MP3QURAN enabled, ITQAN disabled)
  const [enabledSources, setEnabledSources] = useState<Record<string, boolean>>(
    {
      [LinkSource.MP3QURAN]: true,
      [LinkSource.ITQAN]: false,
    },
  );
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  /* load once */
  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_STORAGE_KEY)
      .then((stored) => {
        if (stored) {
          const parsed = JSON.parse(stored);
          // Merge with defaults to ensure new sources are handled if added later
          setEnabledSources((prev) => ({ ...prev, ...parsed }));
        }
      })
      .catch(() => {});

    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((stored) => {
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setThemeModeState(stored);
        }
      })
      .catch(() => {});
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch(() => {});
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

  return (
    <SettingsContext.Provider
      value={{
        enabledSources,
        isSourceEnabled,
        toggleSource,
        themeMode,
        setThemeMode,
        isDark,
      }}
    >
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
