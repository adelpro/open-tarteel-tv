import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinkSource } from "../types";

const SETTINGS_STORAGE_KEY = "@open_tarteel_settings";

type SettingsContextValue = {
  enabledSources: Record<string, boolean>;
  isSourceEnabled: (source: string) => boolean;
  toggleSource: (source: string) => Promise<void>;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  // Default all sources to true initially
  const [enabledSources, setEnabledSources] = useState<Record<string, boolean>>(
    {
      [LinkSource.MP3QURAN]: true,
      [LinkSource.ITQAN]: false,
    },
  );

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
  }, []);

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
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return ctx;
}
