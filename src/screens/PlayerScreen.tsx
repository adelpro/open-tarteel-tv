import React, { useState, useEffect, useCallback, memo } from "react";
import { View, Text, FlatList, StyleSheet, Pressable } from "react-native";
import { useRoute, useFocusEffect } from "@react-navigation/native";
import { SpatialNavigationFocusableView } from "react-tv-space-navigation";
import { SURAHS } from "../constants/surahs";
import { Reciter } from "../types";
import { getAllReciters } from "../services/api";
import { FontAwesome } from "@expo/vector-icons";
import { audioService } from "../services/AudioService";

export default function PlayerScreen() {
  const route = useRoute<any>();
  const [reciter, setReciter] = useState<Reciter | null>(
    route.params?.reciter ?? null
  );
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      audioService.unload();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        audioService.unload();
      };
    }, [])
  );

  useEffect(() => {
    const maybeLoadFromDeepLink = async () => {
      const reciterId: number | undefined = route.params?.reciterId;
      const surahId: number | undefined = route.params?.surahId;
      if (!reciter && reciterId) {
        const all = await getAllReciters();
        const found = all.find((r) => r.id === reciterId) || null;
        if (found) {
          setReciter(found);
          if (surahId) {
            await handleSurahPress(surahId);
          }
        }
      }
    };
    maybeLoadFromDeepLink();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!reciter) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No reciter selected</Text>
      </View>
    );
  }

  const handleSurahPress = useCallback(
    async (surahId: number) => {
      setSelectedSurah(surahId);
      const audioUrl = reciter.moshaf.playlist.find(
        (item) => parseInt(item.surahId) === surahId
      )?.link;

      if (audioUrl) {
        try {
          await audioService.loadAndPlay(audioUrl);
          setIsPlaying(true);
        } catch (error) {
          console.error("Error playing audio:", error);
        }
      }
    },
    [reciter]
  );

  const handlePlayPause = async () => {
    try {
      await audioService.togglePlayPause();
      setIsPlaying(audioService.getIsPlaying());
    } catch (error) {
      console.error("Error toggling playback:", error);
    }
  };

  const handlePrevious = async () => {
    if (!selectedSurah) return;
    const currentIndex = SURAHS.findIndex((s) => s.id === selectedSurah);
    if (currentIndex > 0) {
      await handleSurahPress(SURAHS[currentIndex - 1].id);
    }
  };

  const handleNext = async () => {
    if (!selectedSurah) return;
    const currentIndex = SURAHS.findIndex((s) => s.id === selectedSurah);
    if (currentIndex < SURAHS.length - 1) {
      await handleSurahPress(SURAHS[currentIndex + 1].id);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.reciterName}>{reciter.name}</Text>
        <Text style={styles.moshafName}>{reciter.moshaf.name}</Text>
      </View>

      <FlatList
        data={SURAHS}
        keyExtractor={(item) => item.id.toString()}
        numColumns={3}
        initialNumToRender={18}
        maxToRenderPerBatch={18}
        windowSize={7}
        removeClippedSubviews
        columnWrapperStyle={{ justifyContent: "space-between" }}
        renderItem={({ item, index }) => (
          <SurahItem
            id={item.id}
            name={item.name}
            englishName={item.englishName}
            selected={selectedSurah === item.id}
            preferredFocus={index === 0}
            onPress={handleSurahPress}
          />
        )}
      />

      {selectedSurah && (
        <View style={styles.playerControls}>
          <Text style={styles.nowPlaying}>
            Now Playing:{" "}
            {SURAHS.find((s) => s.id === selectedSurah)?.englishName}
          </Text>
          <View style={styles.controlsRow}>
            <SpatialNavigationFocusableView>
              {({ isFocused }) => (
                <Pressable
                  style={[
                    styles.controlBtn,
                    isFocused && styles.controlBtnFocused,
                  ]}
                  focusable
                  accessibilityRole="button"
                  accessibilityLabel="Previous"
                  onPress={handlePrevious}
                >
                  <FontAwesome
                    name="step-backward"
                    size={30}
                    color={isFocused ? "#4CAF50" : "#fff"}
                  />
                </Pressable>
              )}
            </SpatialNavigationFocusableView>

            <SpatialNavigationFocusableView>
              {({ isFocused }) => (
                <Pressable
                  style={[
                    styles.controlBtn,
                    styles.playBtn,
                    isFocused && styles.controlBtnFocused,
                  ]}
                  focusable
                  accessibilityRole="button"
                  accessibilityLabel={isPlaying ? "Pause" : "Play"}
                  onPress={handlePlayPause}
                >
                  <FontAwesome
                    name={isPlaying ? "pause" : "play"}
                    size={40}
                    color={isFocused ? "#4CAF50" : "#fff"}
                  />
                </Pressable>
              )}
            </SpatialNavigationFocusableView>

            <SpatialNavigationFocusableView>
              {({ isFocused }) => (
                <Pressable
                  style={[
                    styles.controlBtn,
                    isFocused && styles.controlBtnFocused,
                  ]}
                  focusable
                  accessibilityRole="button"
                  accessibilityLabel="Next"
                  onPress={handleNext}
                >
                  <FontAwesome
                    name="step-forward"
                    size={30}
                    color={isFocused ? "#4CAF50" : "#fff"}
                  />
                </Pressable>
              )}
            </SpatialNavigationFocusableView>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  errorText: {
    color: "#fff",
    fontSize: 18,
  },
  header: {
    padding: 20,
    backgroundColor: "#1E1E1E",
    borderBottomWidth: 2,
    borderBottomColor: "#4CAF50",
  },
  reciterName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  moshafName: {
    fontSize: 16,
    color: "#AAA",
    marginTop: 5,
  },
  surahCard: {
    flex: 1,
    backgroundColor: "#1E1E1E",
    margin: 8,
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#333",
    minWidth: 150,
  },
  surahCardFocused: {
    backgroundColor: "#2E7D32",
    borderColor: "#4CAF50",
    transform: [{ scale: 1.05 }],
  },
  surahCardSelected: {
    backgroundColor: "#1976D2",
    borderColor: "#2196F3",
  },
  surahNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 5,
  },
  surahName: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 3,
  },
  surahEnglishName: {
    fontSize: 12,
    color: "#AAA",
  },
  playerControls: {
    padding: 20,
    backgroundColor: "#1E1E1E",
    borderTopWidth: 2,
    borderTopColor: "#4CAF50",
    alignItems: "center",
  },
  nowPlaying: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 15,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 30,
  },
  controlBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  playBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#444",
  },
  controlBtnFocused: {
    borderColor: "#4CAF50",
    backgroundColor: "#2E2E2E",
    transform: [{ scale: 1.1 }],
  },
});
type SurahItemProps = {
  id: number;
  name: string;
  englishName: string;
  selected: boolean;
  preferredFocus: boolean;
  onPress: (id: number) => void;
};

const SurahItem = memo(
  ({
    id,
    name,
    englishName,
    selected,
    preferredFocus,
    onPress,
  }: SurahItemProps) => (
    <SpatialNavigationFocusableView>
      {({ isFocused }) => (
        <Pressable
          style={[
            styles.surahCard,
            isFocused && styles.surahCardFocused,
            selected && styles.surahCardSelected,
          ]}
          focusable
          hasTVPreferredFocus={preferredFocus}
          accessibilityRole="button"
          accessibilityLabel={`Surah ${englishName} number ${id}`}
          onPress={() => onPress(id)}
        >
          <Text style={styles.surahNumber}>{id}</Text>
          <Text style={styles.surahName}>{name}</Text>
          <Text style={styles.surahEnglishName}>{englishName}</Text>
        </Pressable>
      )}
    </SpatialNavigationFocusableView>
  )
);
