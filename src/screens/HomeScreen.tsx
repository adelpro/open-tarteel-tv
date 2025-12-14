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
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SpatialNavigationFocusableView } from "react-tv-space-navigation";
import { Reciter, Riwaya } from "../types";
import { getAllReciters } from "../services/api";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  const [reciters, setReciters] = useState<Reciter[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const styles = createStyles(isDark);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRiwaya, setSelectedRiwaya] = useState<Riwaya | "all">("all");

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
    const data = await getAllReciters();
    setReciters(data);
    setLoading(false);
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
      <SpatialNavigationFocusableView>
        {({ isFocused }) => (
          <Pressable
            style={[styles.reciterCard, isFocused && styles.reciterCardFocused]}
            focusable
            hasTVPreferredFocus={preferredFocus}
            accessibilityRole="button"
            accessibilityLabel={`Reciter ${reciter.name}, Moshaf ${reciter.moshaf.name}`}
            onPress={() => onPress(reciter)}
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
    <SpatialNavigationFocusableView>
      {({ isFocused }) => (
        <Pressable
          style={[styles.menuButton, isFocused && styles.menuButtonFocused]}
          focusable
          accessibilityRole="button"
          accessibilityLabel={label}
          onPress={onPress}
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
          <TextInput
            style={[styles.searchInput, isFocused && styles.searchInputFocused]}
            focusable
            hasTVPreferredFocus={!!preferredFocus}
            accessibilityRole="search"
            accessibilityLabel="Search reciters"
            value={value}
            onChangeText={onChangeText}
            placeholder="Search..."
            placeholderTextColor={isDark ? "#888" : "#777"}
          />
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
    <SpatialNavigationFocusableView>
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
          <Text style={{ color: "#fff", fontSize: 14 }}>{label}</Text>
        </Pressable>
      )}
    </SpatialNavigationFocusableView>
  ));

  type VoiceButtonProps = {
    onPress: () => void;
  };

  const VoiceButton = memo(({ onPress }: VoiceButtonProps) => (
    <SpatialNavigationFocusableView>
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

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading Reciters...</Text>
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
      <FlatList
        data={filteredReciters}
        keyExtractor={(item, index) => `${item.id}-${item.moshaf.id}-${index}`}
        numColumns={4}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={7}
        removeClippedSubviews
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListHeaderComponent={() => (
          <View>
            <View style={styles.searchContainer}>
              <View style={styles.searchRow}>
                <View style={styles.searchIconContainer}>
                  <Ionicons name="search" size={22} color="#999" />
                </View>
                <SearchInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  preferredFocus
                />
                <VoiceButton
                  onPress={() => {
                    navigation.navigate("Search", {
                      q: searchQuery,
                      riwaya:
                        selectedRiwaya === "all" ? undefined : selectedRiwaya,
                    });
                  }}
                />
              </View>
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
          </View>
        )}
        renderItem={({ item }) => (
          <ReciterCard
            reciter={item}
            preferredFocus={false}
            onPress={handleReciterPress}
          />
        )}
      />
    </View>
  );
}

function createStyles(isDark: boolean) {
  const bg = isDark ? "#121212" : "#FFFFFF";
  const textPrimary = isDark ? "#fff" : "#111";
  const textSecondary = isDark ? "#AAA" : "#555";
  const cardBg = isDark ? "#1E1E1E" : "#F5F5F5";
  const border = isDark ? "#333" : "#E0E0E0";
  const focusBg = isDark ? "#2E2E2E" : "#EAEAEA";
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
      fontSize: 16,
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
      fontSize: 24,
      fontWeight: "800",
      color: "#4CAF50",
    },
    brandSubtitle: {
      fontSize: 14,
      color: textSecondary,
      marginTop: 2,
    },
    reciterCard: {
      flex: 1,
      backgroundColor: cardBg,
      margin: 10,
      padding: 20,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: border,
    },
    reciterCardFocused: {
      backgroundColor: isDark ? "#2E7D32" : "#C8E6C9",
      borderColor: "#4CAF50",
      transform: [{ scale: 1.05 }],
    },
    reciterName: {
      fontSize: 18,
      fontWeight: "bold",
      color: textPrimary,
      marginBottom: 5,
    },
    reciterMoshaf: {
      fontSize: 14,
      color: textSecondary,
    },
    searchContainer: {
      marginBottom: 12,
    },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    searchIconContainer: {
      width: 42,
      height: 42,
      borderRadius: 8,
      backgroundColor: cardBg,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: border,
    },
    searchInput: {
      backgroundColor: cardBg,
      color: textPrimary,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: border,
    },
    searchInputFocused: {
      backgroundColor: focusBg,
      borderColor: "#4CAF50",
      transform: [{ scale: 1.02 }],
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
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 999,
      borderWidth: 2,
      borderColor: border,
    },
    filterChipFocused: {
      backgroundColor: isDark ? "#2E7D32" : "#C8E6C9",
      borderColor: "#4CAF50",
      transform: [{ scale: 1.05 }],
    },
    filterChipSelected: {
      backgroundColor: "#1976D2",
      borderColor: "#2196F3",
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
  });
}

// removed module-scope component definitions in favor of inner components
