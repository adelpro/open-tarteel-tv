import React, { useEffect, useState, useCallback, memo, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  TextInput,
  Image,
  useColorScheme,
  useWindowDimensions,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  SpatialNavigationFocusableView,
  SpatialNavigationScrollView,
  SpatialNavigationView,
} from "react-tv-space-navigation";
import { Reciter, Riwaya } from "../types";
import { getAllReciters } from "../services/api";
import { Ionicons } from "@expo/vector-icons";

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
    setRetryCount((prev) => prev + 1);
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

  type ReciterCardProps = {
    reciter: Reciter;
    preferredFocus: boolean;
    onPress: (reciter: Reciter) => void;
  };

  const ReciterCard = memo(
    ({ reciter, preferredFocus, onPress }: ReciterCardProps) => (
      <SpatialNavigationFocusableView onSelect={() => onPress(reciter)}>
        {({ isFocused }) => (
          <Pressable
            style={[styles.reciterCard, isFocused && styles.reciterCardFocused]}
            focusable
            hasTVPreferredFocus={preferredFocus}
            accessibilityRole="button"
            accessibilityLabel={`Reciter ${reciter.name}, Moshaf ${reciter.moshaf.name}`}
          >
            <Text style={styles.reciterName}>{reciter.name}</Text>
            <Text style={styles.reciterMoshaf}>{reciter.moshaf.name}</Text>
          </Pressable>
        )}
      </SpatialNavigationFocusableView>
    )
  );

  type MenuButtonProps = {
    label: string;
    iconName?: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  };

  const MenuButton = memo(({ label, iconName, onPress }: MenuButtonProps) => (
    <SpatialNavigationFocusableView onSelect={onPress}>
      {({ isFocused }) => (
        <Pressable
          style={[styles.menuButton, isFocused && styles.menuButtonFocused]}
          focusable
          accessibilityRole="button"
          accessibilityLabel={label}
        >
          <View style={styles.menuButtonContent}>
            {iconName ? (
              <Ionicons
                name={iconName}
                size={18}
                color={isFocused ? "#4CAF50" : isDark ? "#bbb" : "#666"}
              />
            ) : null}
            <Text style={styles.menuButtonText}>{label}</Text>
          </View>
        </Pressable>
      )}
    </SpatialNavigationFocusableView>
  ));

  type SearchInputProps = {
    value: string;
    onChangeText: (text: string) => void;
    preferredFocus?: boolean;
  };

  const SearchInput = memo(
    ({ value, onChangeText, preferredFocus }: SearchInputProps) => (
      <SpatialNavigationFocusableView>
        {({ isFocused }) => (
          <View
            style={[
              styles.searchInputContainer,
              isFocused && styles.searchInputFocused,
            ]}
          >
            <TextInput
              style={styles.searchInput}
              focusable
              hasTVPreferredFocus={!!preferredFocus}
              accessibilityRole="search"
              accessibilityLabel="Search reciters"
              value={value}
              onChangeText={onChangeText}
              placeholder="Search reciters..."
              placeholderTextColor={isDark ? "#888" : "#999"}
            />
            <Ionicons
              name="search"
              size={20}
              color={isFocused ? "#4CAF50" : isDark ? "#888" : "#999"}
              style={styles.searchInputIcon}
            />
          </View>
        )}
      </SpatialNavigationFocusableView>
    )
  );

  type FilterChipProps = {
    label: string;
    selected: boolean;
    onPress: () => void;
  };

  const FilterChip = memo(({ label, selected, onPress }: FilterChipProps) => (
    <SpatialNavigationFocusableView onSelect={onPress}>
      {({ isFocused }) => (
        <Pressable
          style={[
            styles.filterChip,
            isFocused && styles.filterChipFocused,
            selected && styles.filterChipSelected,
          ]}
          focusable
          accessibilityRole="button"
          accessibilityLabel={`Filter ${label}${selected ? " selected" : ""}`}
          onPress={onPress}
        >
          <Text style={styles.filterChipText}>{label}</Text>
        </Pressable>
      )}
    </SpatialNavigationFocusableView>
  ));

  type VoiceButtonProps = {
    onPress: () => void;
  };

  const VoiceButton = memo(({ onPress }: VoiceButtonProps) => (
    <SpatialNavigationFocusableView onSelect={onPress}>
      {({ isFocused }) => (
        <Pressable
          style={[styles.micButton, isFocused && styles.micButtonFocused]}
          focusable
          accessibilityRole="button"
          accessibilityLabel="Voice search"
          onPress={onPress}
        >
          <Ionicons
            name="mic"
            size={20}
            color={isFocused ? "#4CAF50" : isDark ? "#bbb" : "#666"}
          />
        </Pressable>
      )}
    </SpatialNavigationFocusableView>
  ));

  type RetryButtonProps = {
    onPress: () => void;
  };

  const RetryButton = memo(({ onPress }: RetryButtonProps) => (
    <SpatialNavigationFocusableView onSelect={onPress}>
      {({ isFocused }) => (
        <Pressable
          style={[styles.retryButton, isFocused && styles.retryButtonFocused]}
          focusable
          hasTVPreferredFocus
          accessibilityRole="button"
          accessibilityLabel="Retry loading reciters"
          onPress={onPress}
        >
          <Ionicons
            name="refresh"
            size={20}
            color={isFocused ? "#fff" : "#4CAF50"}
            style={styles.retryButtonIcon}
          />
          <Text
            style={[
              styles.retryButtonText,
              isFocused && styles.retryButtonTextFocused,
            ]}
          >
            Try Again
          </Text>
        </Pressable>
      )}
    </SpatialNavigationFocusableView>
  ));

  const BrandHeader = memo(() => (
    <View style={styles.brandRow}>
      <Image
        source={require("../../assets/icon.png")}
        style={styles.brandLogo}
      />
      <View>
        <Text style={styles.brandTitle}>Open Tarteel TV</Text>
        <Text style={styles.brandSubtitle}>
          Quran recitations • TV optimized
        </Text>
      </View>
    </View>
  ));

  const cardsPerRow = useMemo(() => {
    if (width >= 2800) return 6;
    if (width >= 2200) return 5;
    if (width >= 1600) return 4;
    return 3;
  }, [width]);

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
          <RetryButton onPress={handleRetry} />
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
          <RetryButton onPress={handleRetry} />
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
        />
        <MenuButton
          label="Privacy"
          iconName="shield-checkmark-outline"
          onPress={() => navigation.navigate("Privacy")}
        />
      </View>
      <BrandHeader />
      <SpatialNavigationScrollView>
        <View style={styles.content}>
          <View style={styles.searchContainer}>
            <SearchInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              preferredFocus
            />
          </View>
          <View style={styles.filterRow}>
            <FilterChip
              label="All"
              selected={selectedRiwaya === "all"}
              onPress={() => setSelectedRiwaya("all")}
            />
            <FilterChip
              label="Hafs"
              selected={selectedRiwaya === Riwaya.HAFS_A_ASIM}
              onPress={() => setSelectedRiwaya(Riwaya.HAFS_A_ASIM)}
            />
            <FilterChip
              label="Warsh"
              selected={selectedRiwaya === Riwaya.WARSH_AN_NAFI}
              onPress={() => setSelectedRiwaya(Riwaya.WARSH_AN_NAFI)}
            />
            <FilterChip
              label="Qalun"
              selected={selectedRiwaya === Riwaya.QALUN_AN_NAFI}
              onPress={() => setSelectedRiwaya(Riwaya.QALUN_AN_NAFI)}
            />
            <FilterChip
              label="Alduri"
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
                  <ReciterCard
                    key={`${reciter.id}-${reciter.moshaf.id}`}
                    reciter={reciter}
                    preferredFocus={rowIndex === 0 && cardIndex === 0}
                    onPress={handleReciterPress}
                  />
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
      justifyContent: "space-between",
      alignItems: "stretch",
      marginBottom: 16,
      gap: 12,
    },
    reciterCard: {
      flex: 1,
      backgroundColor: cardBg,
      paddingVertical: isVeryWide ? 28 : isWide ? 24 : 20,
      paddingHorizontal: isVeryWide ? 24 : isWide ? 20 : 16,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: border,
    },
    reciterCardFocused: {
      backgroundColor: isDark ? "#2E7D32" : "#C8E6C9",
      borderColor: "#4CAF50",
      transform: [{ scale: 1.05 }],
    },
    reciterName: {
      fontSize: isVeryWide ? 26 : isWide ? 24 : isMedium ? 20 : 18,
      fontWeight: "bold",
      color: textPrimary,
      marginBottom: 5,
    },
    reciterMoshaf: {
      fontSize: isVeryWide ? 20 : isWide ? 18 : isMedium ? 16 : 14,
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
      borderRadius: 10,
      fontSize: 16,
    },
    searchInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: cardBg,
      borderRadius: 10,
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
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 12,
    },
    filterChip: {
      backgroundColor: cardBg,
      paddingVertical: isVeryWide ? 12 : isWide ? 10 : 8,
      paddingHorizontal: isVeryWide ? 18 : isWide ? 16 : 14,
      borderRadius: 999,
      borderWidth: 2,
      borderColor: border,
    },
    filterChipText: {
      color: textPrimary,
      fontSize: 14,
      fontWeight: "600",
    },
    filterChipFocused: {
      backgroundColor: isDark ? "#2E7D32" : "#C8E6C9",
      borderColor: "#4CAF50",
      transform: [{ scale: 1.05 }],
    },
    filterChipSelected: {
      backgroundColor: "#1976D2",
      borderColor: "#2196F3",
      color: "#fff",
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

// removed module-scope component definitions in favor of inner components
