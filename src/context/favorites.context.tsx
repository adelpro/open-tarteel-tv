import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  subscribeToFavoriteCounts,
  syncFavorite,
} from "../services/gun-service";

const FAVORITES_STORAGE_KEY = "@open_tarteel_favorites";

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
    {}
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
    const unsub = subscribeToFavoriteCounts((id, count) => {
      setFavoriteCounts((prev) => ({ ...prev, [id]: count }));
    });

    return () => unsub();
  }, []);

  const isFavorited = useCallback(
    (id: string) => favorites.includes(id),
    [favorites]
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
        JSON.stringify(updated)
      );

      // side-effect only
      syncFavorite(id, !isFav);
    },
    [favorites]
  );

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        favoriteCounts,
        isFavorited,
        toggleFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

/* hook */
export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return ctx;
}
