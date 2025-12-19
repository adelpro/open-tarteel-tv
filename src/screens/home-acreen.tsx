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
import FilterChip from "../components/filter-chip";
import MenuButton from "../components/menu-button";
import ReciterCard from "../components/reciter-card";
import RetryButton from "../components/retry-button";
import SearchInput from "../components/search-input";
import { getAllReciters } from "../services/api";
import { Reciter, Riwaya } from "../types";
import { colorPrimary } from "../constants/interaction-colors";
import { getThemeColors } from "../constants/theme";
import LanguageSwitch from "../components/language-switch";
import { useTranslation } from "react-i18next";

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
    header: {
      fontSize: 22,
      fontWeight: "700",
      color: colorPrimary,
      marginBottom: 12,
      textAlign: "left",
    },
    filterRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      flexWrap: "wrap",
      marginBottom: 12,
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

    retryCountText: {
      fontSize: 14,
      color: textSecondary,
      marginBottom: 24,
    },

    menuRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "flex-end",
      gap: 12,
      marginBottom: 10,
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
    errorMessage: {
      fontSize: isVeryWide ? 20 : isWide ? 18 : 16,
      color: textSecondary,
      textAlign: "center",
      marginBottom: 24,
      lineHeight: 24,
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

  const filteredReciters = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return reciters.filter((r) => {
      const byText =
        q.length === 0 ||
        r.name.toLowerCase().includes(q) ||
        r.moshaf.name.toLowerCase().includes(q);
      const byRiwaya =
        selectedRiwaya === "all" || r.moshaf.riwaya === selectedRiwaya;
      return byText && byRiwaya;
    });
  }, [reciters, searchQuery, selectedRiwaya]);

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
      <View
        style={[
          styles.menuRow,
          isRTL ? { flexDirection: "row-reverse" } : { flexDirection: "row" },
        ]}
      >
        <MenuButton
          label={t("About")}
          iconName="information-circle-outline"
          onPress={() => navigation.navigate("About")}
          isDark={isDark}
          accessibilityLabel={t("About")}
          accessibilityRole="button"
        />
        <MenuButton
          label={t("Privacy")}
          iconName="shield-checkmark-outline"
          onPress={() => navigation.navigate("Privacy")}
          isDark={isDark}
          accessibilityLabel={t("Privacy")}
          accessibilityRole="button"
        />
        <LanguageSwitch
          isDark={isDark}
          accessibilityLabel={t("change_language")}
          accessibilityRole="button"
        />
      </View>
      <BrandHeader />

      <SearchInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        onFocusChange={setSearchFocused}
        isDark={isDark}
      />

      <SpatialNavigationScrollView>
        <View style={[styles.content]}>
          <View
            style={[
              styles.filterRow,
              { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
            <FilterChip
              label={t("filter_all")}
              selected={selectedRiwaya === "all"}
              onPress={() => setSelectedRiwaya("all")}
            />

            <FilterChip
              label={t("filter_hafs")}
              selected={selectedRiwaya === Riwaya.HAFS_A_ASIM}
              onPress={() => setSelectedRiwaya(Riwaya.HAFS_A_ASIM)}
            />
            <FilterChip
              label={t("filter_warsh")}
              selected={selectedRiwaya === Riwaya.WARSH_AN_NAFI}
              onPress={() => setSelectedRiwaya(Riwaya.WARSH_AN_NAFI)}
            />
            <FilterChip
              label={t("filter_qalun")}
              selected={selectedRiwaya === Riwaya.QALUN_AN_NAFI}
              onPress={() => setSelectedRiwaya(Riwaya.QALUN_AN_NAFI)}
            />
            <FilterChip
              label={t("filter_ad_duri")}
              selected={selectedRiwaya === Riwaya.ALDURI_AN_ALKAISSAI}
              onPress={() => setSelectedRiwaya(Riwaya.ALDURI_AN_ALKAISSAI)}
            />
          </View>
          {reciterRows.map((row, rowIndex) => (
            <SpatialNavigationView
              key={`row-${rowIndex}`}
              direction="horizontal"
            >
              <View style={styles.reciterRow}>
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
                    />
                  </View>
                ))}
              </View>
            </SpatialNavigationView>
          ))}
        </View>
      </SpatialNavigationScrollView>
    </View>
  );
}
