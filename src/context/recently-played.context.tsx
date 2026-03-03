import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENTLY_PLAYED_STORAGE_KEY = '@open_tarteel_recently_played';
const MAX_RECENTLY_PLAYED = 10; // Keep last 10 played reciters

export type RecentlyPlayedItem = {
  reciterId: string;
  playedAt: number; // timestamp
};

type RecentlyPlayedContextValue = {
  recentlyPlayed: RecentlyPlayedItem[];
  addToRecentlyPlayed: (reciterId: string) => Promise<void>;
};

const RecentlyPlayedContext = createContext<RecentlyPlayedContextValue | null>(
  null,
);

export function RecentlyPlayedProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [recentlyPlayed, setRecentlyPlayed] = useState<RecentlyPlayedItem[]>(
    [],
  );

  /* load once */
  useEffect(() => {
    AsyncStorage.getItem(RECENTLY_PLAYED_STORAGE_KEY)
      .then((stored) => {
        if (stored) {
          const parsed: RecentlyPlayedItem[] = JSON.parse(stored);
          // Sort by most recent first
          setRecentlyPlayed(parsed.sort((a, b) => b.playedAt - a.playedAt));
        }
      })
      .catch(() => {});
  }, []);

  const addToRecentlyPlayed = useCallback(async (reciterId: string) => {
    setRecentlyPlayed((prev) => {
      // Remove if already in list (we'll add it at the beginning)
      const filtered = prev.filter((item) => item.reciterId !== reciterId);

      // Add to beginning with current timestamp
      const updated = [
        {
          reciterId,
          playedAt: Date.now(),
        },
        ...filtered,
      ];

      // Keep only the last MAX_RECENTLY_PLAYED items
      const limited = updated.slice(0, MAX_RECENTLY_PLAYED);

      // Persist to storage
      AsyncStorage.setItem(
        RECENTLY_PLAYED_STORAGE_KEY,
        JSON.stringify(limited),
      ).catch(() => {});

      return limited;
    });
  }, []);

  return (
    <RecentlyPlayedContext.Provider
      value={{
        recentlyPlayed,
        addToRecentlyPlayed,
      }}
    >
      {children}
    </RecentlyPlayedContext.Provider>
  );
}

/* hook */
export function useRecentlyPlayed() {
  const ctx = useContext(RecentlyPlayedContext);
  if (!ctx) {
    throw new Error(
      'useRecentlyPlayed must be used within RecentlyPlayedProvider',
    );
  }
  return ctx;
}
