import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import {
  subscribeToFavoriteCounts,
  subscribeToViewCounts,
} from "../services/gun-service";

interface GlobalStatsContextType {
  favoriteCounts: Record<string, number>;
  viewCounts: Record<string, number>;
}

const GlobalStatsContext = createContext<GlobalStatsContextType | undefined>(
  undefined
);

export function GlobalStatsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [favoriteCounts, setFavoriteCounts] = useState<Record<string, number>>(
    {}
  );
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const mounted = useRef(false);

  useEffect(() => {
    console.log("[Stats] GlobalStatsProvider mounted");

    const unsubFavorites = subscribeToFavoriteCounts((counts) => {
      console.log(
        "[Stats] Received Favorite Updates:",
        Object.keys(counts).length,
        "items"
      );
      setFavoriteCounts((prev) => ({ ...prev, ...counts }));
    });

    const unsubViews = subscribeToViewCounts((counts) => {
      console.log(
        "[Stats] Received View Updates:",
        Object.keys(counts).length,
        "items"
      );
      setViewCounts((prev) => ({ ...prev, ...counts }));
    });

    return () => {
      console.log("[Stats] GlobalStatsProvider cleanup");
      unsubFavorites();
      unsubViews();
    };
  }, []);

  return (
    <GlobalStatsContext.Provider value={{ favoriteCounts, viewCounts }}>
      {children}
    </GlobalStatsContext.Provider>
  );
}

export function useGlobalStats() {
  const context = useContext(GlobalStatsContext);
  if (context === undefined) {
    throw new Error("useGlobalStats must be used within a GlobalStatsProvider");
  }
  return context;
}
