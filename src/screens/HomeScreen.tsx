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

export default function HomeScreen() {
  const [reciters, setReciters] = useState<Reciter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const { width } = useWindowDimensions();
  const styles = createStyles(isDark, width);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRiwaya, setSelectedRiwaya] = useState<Riwaya | "all">("all");
  const [retryCount, setRetryCount] = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);
  const MAX_RETRIES = 3;

  useEffect(() => {
    loadReciters();
  }, []);

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

  const loadReciters = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllReciters();
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
    loadReciters();
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
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading Reciters...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#FF6B6B" />
          <Text style={styles.errorTitle}>Failed to Load Reciters</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Text style={styles.retryCountText}>
            Attempt {retryCount + 1} of {MAX_RETRIES + 1}
          </Text>
          <RetryButton onPress={handleRetry} styles={styles} />
        </View>
      </View>
    );
  }

  if (!loading && reciters.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.errorContainer}>
          <Ionicons name="folder-outline" size={64} color="#999" />
          <Text style={styles.errorTitle}>No Reciters Found</Text>
          <Text style={styles.errorMessage}>
            No reciter data available. Please check your connection.
          </Text>
          <RetryButton onPress={handleRetry} styles={styles} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.menuRow}>
        <MenuButton
          label="About"
          iconName="information-circle-outline"
          onPress={() => navigation.navigate("About")}
          styles={styles}
          isDark={isDark}
        />
        <MenuButton
          label="Privacy"
          iconName="shield-checkmark-outline"
          onPress={() => navigation.navigate("Privacy")}
          styles={styles}
          isDark={isDark}
        />
      </View>
      <BrandHeader styles={styles} />
      <View style={styles.searchContainer}>
        <SearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocusChange={setSearchFocused}
          styles={styles}
          isDark={isDark}
        />
      </View>
      <SpatialNavigationScrollView>
        <View style={styles.content}>
          <View style={styles.filterRow}>
            <FilterChip
              label="All"
              selected={selectedRiwaya === "all"}
              onPress={() => setSelectedRiwaya("all")}
              styles={styles}
            />
            <FilterChip
              label="Hafs"
              selected={selectedRiwaya === Riwaya.HAFS_A_ASIM}
              onPress={() => setSelectedRiwaya(Riwaya.HAFS_A_ASIM)}
              styles={styles}
            />
            <FilterChip
              label="Warsh"
              selected={selectedRiwaya === Riwaya.WARSH_AN_NAFI}
              onPress={() => setSelectedRiwaya(Riwaya.WARSH_AN_NAFI)}
              styles={styles}
            />
            <FilterChip
              label="Qalun"
              selected={selectedRiwaya === Riwaya.QALUN_AN_NAFI}
              onPress={() => setSelectedRiwaya(Riwaya.QALUN_AN_NAFI)}
              styles={styles}
            />
            <FilterChip
              label="Alduri"
              selected={selectedRiwaya === Riwaya.ALDURI_AN_ALKAISSAI}
              onPress={() => setSelectedRiwaya(Riwaya.ALDURI_AN_ALKAISSAI)}
              styles={styles}
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
                      styles={styles}
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

function createStyles(isDark: boolean, width: number) {
  const bg = isDark ? "#121212" : "#FFFFFF";
  const textPrimary = isDark ? "#fff" : "#111";
  const textSecondary = isDark ? "#AAA" : "#555";
  const cardBg = isDark ? "#1E1E1E" : "#EFEFEF";
  const border = isDark ? "#333" : "#D0D0D0";
  const focusBg = isDark ? "#2E2E2E" : "#E0E0E0";
  const isVeryWide = width >= 2800;
  const isWide = width >= 2200 && width < 2800;
  const isMedium = width >= 1600 && width < 2200;
  return StyleSheet.create({
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
      color: "#4CAF50",
      marginBottom: 12,
      textAlign: "left",
    },
    brandRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 12,
    },
    brandLogo: {
      width: 56,
      height: 56,
      borderRadius: 12,
    },
    brandTitle: {
      fontSize: isVeryWide ? 34 : isWide ? 30 : isMedium ? 26 : 24,
      fontWeight: "800",
      color: "#4CAF50",
    },
    brandSubtitle: {
      fontSize: isVeryWide ? 20 : isWide ? 18 : 14,
      color: textSecondary,
      marginTop: 2,
    },
    reciterRow: {
      flexDirection: "row",
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
    reciterCard: {
      width: "100%",
      height: isVeryWide ? 140 : isWide ? 128 : isMedium ? 118 : 110,
      backgroundColor: cardBg,
      paddingVertical: isVeryWide ? 28 : isWide ? 24 : 20,
      paddingHorizontal: isVeryWide ? 24 : isWide ? 20 : 16,
      margin: 2,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: border,
    },
    reciterCardFocused: {
      backgroundColor: isDark ? "#2E7D32" : "#C8E6C9",
      borderColor: "#4CAF50",
      transform: [{ scale: 1.05 }],
      zIndex: 2,
    },
    reciterName: {
      fontSize: isVeryWide ? 26 : isWide ? 24 : isMedium ? 20 : 18,
      fontWeight: "bold",
      color: textPrimary,
      marginBottom: 5,
    },
    reciterDesc: {
      fontSize: isVeryWide ? 18 : isWide ? 16 : isMedium ? 15 : 14,
      color: textSecondary,
    },
    searchContainer: {
      marginBottom: 16,
      alignItems: "center",
      paddingHorizontal: 20,
      width: "100%",
    },
    searchInput: {
      backgroundColor: cardBg,
      color: textPrimary,
      flex: 1,
      paddingVertical: isVeryWide ? 16 : isWide ? 14 : 12,
      paddingHorizontal: isVeryWide ? 16 : isWide ? 14 : 12,
      borderRadius: 8,
      fontSize: 16,
    },
    searchInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: cardBg,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: border,
      paddingHorizontal: 14,
      width: "100%",
    },
    searchInputIcon: {
      marginLeft: 10,
    },
    searchInputFocused: {
      backgroundColor: focusBg,
      borderColor: "#4CAF50",
    },
    filterRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      flexWrap: "wrap",
      marginBottom: 12,
    },
    filterChip: {
      backgroundColor: cardBg,
      paddingVertical: isVeryWide ? 12 : isWide ? 10 : 10,
      paddingHorizontal: isVeryWide ? 20 : isWide ? 18 : 16,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: border,
      margin: 4,
      marginRight: 12,
      marginBottom: 12,
    },
    filterChipText: {
      color: textPrimary,
      fontSize: 14,
      fontWeight: "600",
    },
    filterChipTextSelected: {
      color: "#fff",
    },
    filterChipFocused: {
      backgroundColor: isDark ? "#2E7D32" : "#E8F5E9",
      borderColor: "#4CAF50",
      transform: [{ scale: 1.05 }],
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 2,
    },
    filterChipSelected: {
      backgroundColor: "#4CAF50",
      borderColor: "#4CAF50",
    },
    menuRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 12,
      marginBottom: 10,
    },
    menuButton: {
      backgroundColor: cardBg,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: border,
    },
    menuButtonFocused: {
      backgroundColor: isDark ? "#2E7D32" : "#C8E6C9",
      borderColor: "#4CAF50",
      transform: [{ scale: 1.05 }],
    },
    menuButtonText: {
      color: textPrimary,
      fontSize: 16,
      fontWeight: "600",
    },
    menuButtonContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    micButton: {
      width: 42,
      height: 42,
      borderRadius: 8,
      backgroundColor: cardBg,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: border,
    },
    micButtonFocused: {
      backgroundColor: focusBg,
      borderColor: "#4CAF50",
      transform: [{ scale: 1.05 }],
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
    retryCountText: {
      fontSize: 14,
      color: textSecondary,
      marginBottom: 24,
    },
    retryButton: {
      backgroundColor: "#4CAF50",
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 2,
      borderColor: "#4CAF50",
    },
    retryButtonFocused: {
      backgroundColor: "#45a049",
      borderColor: "#fff",
      transform: [{ scale: 1.08 }],
    },
    retryButtonIcon: {
      marginRight: 10,
    },
    retryButtonText: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "600",
    },
    retryButtonTextFocused: {
      color: "#fff",
    },
  });
}
