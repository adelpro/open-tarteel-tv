import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  useColorScheme,
  useWindowDimensions,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  SpatialNavigationScrollView,
  SpatialNavigationView,
} from "react-tv-space-navigation";
import { Ionicons } from "@expo/vector-icons";
import BrandHeader from "../components/brand-header";
import ReciterCard from "../components/reciter-card";
import RetryButton from "../components/retry-button";
import SearchInput from "../components/search-input";
import SectionFeatured from "../components/section-featured";
import SectionFilters from "../components/section-filters";
import SectionTopNav from "../components/section-top-nav";
import { getAllReciters } from "../services/api";
import { Reciter, Riwaya } from "../types";
import { colorPrimary } from "../constants/interaction-colors";
import { getThemeColors } from "../constants/theme";
import { useTranslation } from "react-i18next";
import Fuse from "fuse.js";
import { normalizeSearchText } from "../utils/search";
import { useFavorites } from "../hooks/use-favorites";
import { useViewCounts } from "../hooks/use-view-counts";

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";
  const [reciters, setReciters] = useState<Reciter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const { width } = useWindowDimensions();
  const { viewCounts } = useViewCounts();
  const { favoriteCounts } = useFavorites();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRiwaya, setSelectedRiwaya] = useState<Riwaya | "all">("all");
  const [retryCount, setRetryCount] = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);
  const MAX_RETRIES = 3;

  const { bg, textPrimary, textSecondary, errorPrimary } =
    getThemeColors(isDark);
  const isVeryWide = width >= 2800;
  const isWide = width >= 2200 && width < 2800;
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: bg,
      padding: 20,
    },
    centerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: bg,
    },
    loadingText: {
      color: textPrimary,
      marginTop: 10,
      fontSize: isVeryWide ? 24 : isWide ? 20 : 16,
    },
    content: {
      paddingBottom: 40,
      paddingTop: 8,
      overflow: "visible",
    },
    reciterRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "flex-start",
      alignItems: "flex-start",
      marginBottom: 16,
      overflow: "visible",
      paddingHorizontal: 20,
    },
    reciterItem: {
      overflow: "visible",
      marginVertical: 8,
    },

    errorMessage: {
      fontSize: isVeryWide ? 20 : isWide ? 18 : 16,
      color: textSecondary,
      textAlign: "center",
      marginBottom: 24,
      lineHeight: 24,
    },
    errorContainer: {
      alignItems: "center",
      paddingHorizontal: 40,
    },
    errorTitle: {
      fontSize: isVeryWide ? 32 : isWide ? 28 : 24,
      fontWeight: "700",
      color: textPrimary,
      marginTop: 20,
      marginBottom: 12,
    },
    retryCountText: {
      fontSize: 14,
      color: textSecondary,
      marginBottom: 24,
    },
  });

  useEffect(() => {
    const lang = i18n.language === "ar" ? "ar" : "en";
    loadReciters(lang);
  }, [i18n.language]);

  useEffect(() => {
    const rn = route.name as string | undefined;
    if (rn === "Search") {
      const q = route.params?.q as string | undefined;
      const riw = route.params?.riwaya as string | undefined;
      setSearchQuery(q ?? "");
      if (riw && (Object.values(Riwaya) as string[]).includes(riw)) {
        setSelectedRiwaya(riw as Riwaya);
      } else {
        setSelectedRiwaya("all");
      }
    }
  }, [route]);

  const loadReciters = async (lang: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllReciters(lang);
      setReciters(data);
      setRetryCount(0);
      setError(null);
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Failed to load reciters. Please try again.";
      setError(errorMsg);
      setReciters([]);
    } finally {
      setLoading(false);
    }
  };
  const handleRetry = () => {
    setRetryCount((prev: number) => prev + 1);
    const lang = i18n.language === "ar" ? "ar" : "en";
    loadReciters(lang);
  };

  const handleReciterPress = useCallback(
    (reciter: Reciter) => {
      navigation.navigate("Player", { reciter });
    },
    [navigation]
  );

  const mostViewedReciters = useMemo(() => {
    if (!reciters.length) {
      return [];
    }

    const uniqueById = new Map<string, Reciter>();
    reciters.forEach((r) => {
      const idStr = String(r.id);
      if (!uniqueById.has(idStr)) {
        uniqueById.set(idStr, r);
      }
    });

    const viewed = Array.from(uniqueById.values())
      .filter((r) => {
        const idStr = String(r.id);
        const count = viewCounts[idStr] || 0;
        return count > 0;
      })
      .sort((a, b) => {
        const countB = viewCounts[String(b.id)] || 0;
        const countA = viewCounts[String(a.id)] || 0;
        return countB - countA;
      })
      .slice(0, 10);

    return viewed;
  }, [reciters, viewCounts]);

  const mostFavoritedReciters = useMemo(() => {
    if (!reciters.length) return [];

    const uniqueById = new Map<string, Reciter>();
    reciters.forEach((r) => {
      const idStr = String(r.id);
      if (!uniqueById.has(idStr)) {
        uniqueById.set(idStr, r);
      }
    });

    const favorited = Array.from(uniqueById.values())
      .filter((r) => {
        const idStr = String(r.id);
        const count = favoriteCounts[idStr] || 0;
        return count > 0;
      })
      .sort((a, b) => {
        const countB = favoriteCounts[String(b.id)] || 0;
        const countA = favoriteCounts[String(a.id)] || 0;
        return countB - countA;
      })
      .slice(0, 10);

    return favorited;
  }, [reciters, favoriteCounts]);

  const filteredReciters = useMemo(() => {
    const searchLanguage = i18n.language === "ar" ? "ar" : "en";

    const matchesRiwaya = (reciter: Reciter) =>
      selectedRiwaya === "all" || reciter.moshaf.riwaya === selectedRiwaya;

    const baseList = reciters.filter(matchesRiwaya);

    const normalizedQuery = normalizeSearchText(searchQuery, searchLanguage);
    if (!normalizedQuery.length) {
      return baseList;
    }

    type ReciterSearchItem = Reciter & {
      searchName: string;
      searchMoshafName: string;
    };

    const items: ReciterSearchItem[] = baseList.map((reciter) => ({
      ...reciter,
      searchName: normalizeSearchText(reciter.name, searchLanguage),
      searchMoshafName: normalizeSearchText(
        reciter.moshaf.name,
        searchLanguage
      ),
    }));

    const fuse = new Fuse(items, {
      keys: [
        { name: "searchName", weight: 0.6 },
        { name: "searchMoshafName", weight: 0.4 },
      ],
      threshold: 0.4,
      ignoreLocation: true,
      minMatchCharLength: 1,
    });

    const results = fuse.search(normalizedQuery);
    return results.map((entry) => entry.item);
  }, [reciters, searchQuery, selectedRiwaya, i18n.language]);

  const cardsPerRow = useMemo(() => {
    if (width >= 2800) return 6;
    if (width >= 2200) return 5;
    if (width >= 1600) return 4;
    return 3;
  }, [width]);

  const itemWidth = useMemo(() => {
    const contentPadding = 20;
    const rowPadding = 20;
    const rowGap = 12;
    const available = width - contentPadding * 2 - rowPadding * 2;
    const gutters = rowGap * (cardsPerRow - 1);
    const w = (available - gutters) / cardsPerRow;
    return w > 0 ? Math.floor(w) : 0;
  }, [width, cardsPerRow]);

  const reciterRows = useMemo(() => {
    const rows: Reciter[][] = [];
    filteredReciters.forEach((reciter, index) => {
      const rowIndex = Math.floor(index / cardsPerRow);
      if (!rows[rowIndex]) {
        rows[rowIndex] = [];
      }
      rows[rowIndex].push(reciter);
    });
    return rows;
  }, [filteredReciters, cardsPerRow]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colorPrimary} />
        <Text style={styles.loadingText}>{t("Loading_Reciters")}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={errorPrimary} />
          <Text style={styles.errorTitle}>{t("Failed_to_Load_Reciters")}</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Text style={styles.retryCountText}>
            {t("attempt", {
              current: retryCount + 1,
              max: MAX_RETRIES + 1,
            })}
          </Text>
          <RetryButton onPress={handleRetry} />
        </View>
      </View>
    );
  }

  if (!loading && reciters.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.errorContainer}>
          <Ionicons name="folder-outline" size={64} color={textSecondary} />
          <Text style={styles.errorTitle}>{t("No_Reciters_Found_Title")}</Text>
          <Text style={styles.errorMessage}>
            {t("No_Reciters_Found_Content")}
          </Text>
          <RetryButton onPress={handleRetry} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionTopNav isRTL={isRTL} isDark={isDark} />
      <BrandHeader />

      <SpatialNavigationScrollView>
        <View style={[styles.content]}>
          <SpatialNavigationView
            direction="vertical"
            style={{ marginBottom: 16 }}
          >
            <SearchInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocusChange={setSearchFocused}
              isDark={isDark}
            />
          </SpatialNavigationView>

          <SectionFeatured
            title={`${t("most_viewed")} (${mostViewedReciters.length})`}
            reciters={mostViewedReciters}
            itemWidth={itemWidth}
            isRTL={isRTL}
            viewCounts={viewCounts}
            favoriteCounts={favoriteCounts}
            onReciterPress={handleReciterPress}
            isVeryWide={isVeryWide}
            isWide={isWide}
            textPrimary={textPrimary}
          />

          <SectionFeatured
            title={`${t("most_favorited")} (${mostFavoritedReciters.length})`}
            reciters={mostFavoritedReciters}
            itemWidth={itemWidth}
            isRTL={isRTL}
            viewCounts={viewCounts}
            favoriteCounts={favoriteCounts}
            onReciterPress={handleReciterPress}
            isVeryWide={isVeryWide}
            isWide={isWide}
            textPrimary={textPrimary}
          />

          <SectionFilters
            selectedRiwaya={selectedRiwaya}
            onSelectRiwaya={setSelectedRiwaya}
            isRTL={isRTL}
          />

          {reciterRows.map((row, rowIndex) => (
            <SpatialNavigationView
              key={`row-${rowIndex}`}
              direction="horizontal"
              style={styles.reciterRow}
            >
              {row.map((reciter, cardIndex) => (
                <View
                  style={[
                    styles.reciterItem,
                    {
                      width: itemWidth,
                      marginRight: cardIndex === row.length - 1 ? 0 : 12,
                    },
                  ]}
                  key={`${reciter.id}-${reciter.moshaf.id}`}
                >
                  <ReciterCard
                    reciter={reciter}
                    preferredFocus={
                      !searchFocused && rowIndex === 0 && cardIndex === 0
                    }
                    onPress={handleReciterPress}
                    viewCount={viewCounts[reciter.id.toString()]}
                    favoriteCount={favoriteCounts[reciter.id.toString()]}
                  />
                </View>
              ))}
            </SpatialNavigationView>
          ))}
        </View>
      </SpatialNavigationScrollView>
    </View>
  );
}
