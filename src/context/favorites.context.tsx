import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  subscribeToFavoriteCounts,
  syncFavorite,
} from '../services/gun-service';
import { createCountBatcher, mergeCountEvents } from '../utils/count-batcher';

const FAVORITES_STORAGE_KEY = '@open_tarteel_favorites';

type FavoritesContextValue = {
  favorites: string[];
  favoriteCounts: Record<string, number>;
  isFavorited: (id: string) => boolean;
  toggleFavorite: (id: string) => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteCounts, setFavoriteCounts] = useState<Record<string, number>>(
    {},
  );

  /* load once */
  useEffect(() => {
    AsyncStorage.getItem(FAVORITES_STORAGE_KEY)
      .then((stored) => {
        if (stored) setFavorites(JSON.parse(stored));
      })
      .catch(() => {});
  }, []);

  /* gun subscription once */
  useEffect(() => {
    /* one state update per animation frame instead of one per GUN event */
    const batcher = createCountBatcher((events) => {
      setFavoriteCounts((prev) => mergeCountEvents(prev, events));
    });

    const unsub = subscribeToFavoriteCounts((id, count) => {
      batcher.push(id, count);
    });

    return () => {
      unsub();
      batcher.dispose();
    };
  }, []);

  const isFavorited = useCallback(
    (id: string) => favorites.includes(id),
    [favorites],
  );

  const toggleFavorite = useCallback(
    async (id: string) => {
      const isFav = favorites.includes(id);

      const updated = isFav
        ? favorites.filter((f) => f !== id)
        : [...favorites, id];

      setFavorites(updated);
      await AsyncStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(updated),
      );

      // side-effect only
      syncFavorite(id, !isFav);
    },
    [favorites],
  );

  const contextValue = useMemo(
    () => ({
      favorites,
      favoriteCounts,
      isFavorited,
      toggleFavorite,
    }),
    [favorites, favoriteCounts, isFavorited, toggleFavorite],
  );

  return (
    <FavoritesContext.Provider value={contextValue}>
      {children}
    </FavoritesContext.Provider>
  );
}

/* hook */
export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return ctx;
}
