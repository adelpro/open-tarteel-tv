import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { syncFavorite } from "../services/gun-service";

const FAVORITES_STORAGE_KEY = "@open_tarteel_favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load favorites", e);
    }
  };

  const isFavorited = (id: string) => favorites.includes(id);

  const toggleFavorite = async (id: string) => {
    try {
      let updatedFavorites: string[];
      const currentlyFavorited = isFavorited(id);

      if (currentlyFavorited) {
        updatedFavorites = favorites.filter((favId) => favId !== id);
      } else {
        updatedFavorites = [...favorites, id];
      }

      setFavorites(updatedFavorites);
      await AsyncStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(updatedFavorites)
      );

      // Sync with global Gun store
      syncFavorite(id, !currentlyFavorited);
    } catch (e) {
      console.error("Failed to toggle favorite", e);
    }
  };

  return { favorites, isFavorited, toggleFavorite };
}
