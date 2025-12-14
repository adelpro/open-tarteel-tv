import React, {
  useState,
  useEffect,
  useCallback,
  memo,
  useRef,
  useMemo,
} from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
} from "react-native";
import { useRoute, useFocusEffect } from "@react-navigation/native";
import { SpatialNavigationFocusableView } from "react-tv-space-navigation";
import { SURAHS } from "../constants/surahs";
import { Reciter } from "../types";
import { getAllReciters } from "../services/api";
import { FontAwesome } from "@expo/vector-icons";
import { audioService } from "../services/AudioService";

const isArabicText = (text: string) => /[\u0600-\u06FF]/.test(text);

export default function PlayerScreen() {
  const route = useRoute<any>();
  const [reciter, setReciter] = useState<Reciter | null>(
    route.params?.reciter ?? null
  );
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [repeat, setRepeat] = useState(false);
  const [muted, setMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(1);

  const playlistData = useMemo(
    () => SURAHS.slice().sort((a, b) => a.id - b.id),
    []
  );

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

  const riwayaLabel = (r: Reciter["moshaf"]["riwaya"]) => {
    if (r === "warsh-an-nafi") return "Warsh";
    if (r === "qalun-an-nafi") return "Qalun";
    if (r === "alduri-an-alkaissai") return "Ad-Duri";
    return "Hafs";
  };

  const AudioSpectrum = memo(({ playing }: { playing: boolean }) => {
    const bars = 14;
    const valuesRef = useRef<Animated.Value[]>(
      Array.from({ length: bars }, () => new Animated.Value(0.6))
    );
    const loopsRef = useRef<Animated.CompositeAnimation[]>([]);
    useEffect(() => {
      loopsRef.current.forEach((l) => l.stop());
      loopsRef.current = [];
      if (!playing) return;
      valuesRef.current.forEach((v, i) => {
        const up = Animated.timing(v, {
          toValue: 1,
          duration: 300 + i * 20,
          easing: Easing.linear,
          useNativeDriver: true,
        });
        const down = Animated.timing(v, {
          toValue: 0.4,
          duration: 300 + i * 20,
          easing: Easing.linear,
          useNativeDriver: true,
        });
        const loop = Animated.loop(Animated.sequence([up, down]));
        loopsRef.current.push(loop);
        loop.start();
      });
      return () => {
        loopsRef.current.forEach((l) => l.stop());
        loopsRef.current = [];
      };
    }, [playing]);
    return (
      <View style={styles.spectrumRow}>
        {valuesRef.current.map((val, idx) => (
          <Animated.View
            key={`bar-${idx}`}
            style={[
              styles.spectrumBar,
              {
                transform: [{ scaleY: val }],
              },
            ]}
          />
        ))}
      </View>
    );
  });

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

  const handleStop = async () => {
    try {
      await audioService.unload();
      setIsPlaying(false);
    } catch (error) {
      console.error("Error stopping playback:", error);
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

  const handleVolumeChange = useCallback(
    (delta: number) => {
      const next = Math.min(1, Math.max(0, volume + delta));
      setVolume(next);
      audioService.setVolume(next);
      if (next === 0 && !muted) {
        setMuted(true);
        setPreviousVolume(volume);
      }
      if (next > 0 && muted) {
        setMuted(false);
      }
    },
    [volume, muted]
  );

  const handleToggleMute = useCallback(() => {
    if (!muted) {
      setPreviousVolume(volume);
      setMuted(true);
      setVolume(0);
      audioService.setVolume(0);
    } else {
      const restore = previousVolume;
      setMuted(false);
      setVolume(restore);
      audioService.setVolume(restore);
    }
  }, [muted, previousVolume, volume]);

  const handleToggleRepeat = () => {
    const next = !repeat;
    setRepeat(next);
    audioService.setRepeat(next);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.reciterName}>{reciter.name}</Text>
        <Text
          style={[
            styles.moshafName,
            isArabicText(reciter.moshaf.name) && styles.arabicText,
          ]}
        >
          {reciter.moshaf.name}
        </Text>
        <Text style={styles.moshafMeta}>
          {riwayaLabel(reciter.moshaf.riwaya)} • {reciter.moshaf.surah_total}{" "}
          surahs • Source: {reciter.source}
        </Text>
      </View>

      <View style={styles.playlistContainer}>
        <FlatList
          data={playlistData}
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
              revelationType={item.revelationType}
              ayahCount={item.ayahCount}
              selected={selectedSurah === item.id}
              preferredFocus={index === 0}
              onPress={handleSurahPress}
            />
          )}
        />
      </View>

      {selectedSurah && (
        <View style={styles.playerControls}>
          <Text style={styles.nowPlaying}>
            Now Playing:{" "}
            {SURAHS.find((s) => s.id === selectedSurah)?.englishName}
          </Text>
          <Text style={styles.controlsMeta}>
            Volume {Math.round(volume * 100)}% {muted ? "(Muted)" : ""} • Repeat{" "}
            {repeat ? "On" : "Off"}
          </Text>
          <AudioSpectrum playing={isPlaying} />
          <View style={styles.controlsRow}>
            <SpatialNavigationFocusableView>
              {({ isFocused }) => (
                <Pressable
                  style={[
                    styles.controlBtnRect,
                    isFocused && styles.controlBtnFocused,
                  ]}
                  focusable
                  accessibilityRole="button"
                  accessibilityLabel="Stop"
                  onPress={handleStop}
                >
                  <FontAwesome
                    name="stop"
                    size={24}
                    color={isFocused ? "#4CAF50" : "#fff"}
                  />
                </Pressable>
              )}
            </SpatialNavigationFocusableView>

            <SpatialNavigationFocusableView>
              {({ isFocused }) => (
                <Pressable
                  style={[
                    styles.controlBtnRect,
                    isFocused && styles.controlBtnFocused,
                  ]}
                  focusable
                  accessibilityRole="button"
                  accessibilityLabel="Previous"
                  onPress={handlePrevious}
                >
                  <FontAwesome
                    name="step-backward"
                    size={28}
                    color={isFocused ? "#4CAF50" : "#fff"}
                  />
                </Pressable>
              )}
            </SpatialNavigationFocusableView>

            <SpatialNavigationFocusableView>
              {({ isFocused }) => (
                <Pressable
                  style={[
                    styles.controlBtnRectWide,
                    isFocused && styles.controlBtnFocused,
                  ]}
                  focusable
                  accessibilityRole="button"
                  accessibilityLabel={isPlaying ? "Pause" : "Play"}
                  onPress={handlePlayPause}
                >
                  <FontAwesome
                    name={isPlaying ? "pause" : "play"}
                    size={32}
                    color={isFocused ? "#4CAF50" : "#fff"}
                  />
                </Pressable>
              )}
            </SpatialNavigationFocusableView>

            <SpatialNavigationFocusableView>
              {({ isFocused }) => (
                <Pressable
                  style={[
                    styles.controlBtnRect,
                    isFocused && styles.controlBtnFocused,
                  ]}
                  focusable
                  accessibilityRole="button"
                  accessibilityLabel="Next"
                  onPress={handleNext}
                >
                  <FontAwesome
                    name="step-forward"
                    size={28}
                    color={isFocused ? "#4CAF50" : "#fff"}
                  />
                </Pressable>
              )}
            </SpatialNavigationFocusableView>

            <SpatialNavigationFocusableView>
              {({ isFocused }) => (
                <Pressable
                  style={[
                    styles.controlBtnRect,
                    isFocused && styles.controlBtnFocused,
                  ]}
                  focusable
                  accessibilityRole="button"
                  accessibilityLabel="Volume down"
                  onPress={() => handleVolumeChange(-0.1)}
                >
                  <FontAwesome
                    name="volume-down"
                    size={24}
                    color={isFocused ? "#4CAF50" : "#fff"}
                  />
                </Pressable>
              )}
            </SpatialNavigationFocusableView>

            <SpatialNavigationFocusableView>
              {({ isFocused }) => (
                <Pressable
                  style={[
                    styles.controlBtnRect,
                    isFocused && styles.controlBtnFocused,
                  ]}
                  focusable
                  accessibilityRole="button"
                  accessibilityLabel="Volume up"
                  onPress={() => handleVolumeChange(0.1)}
                >
                  <FontAwesome
                    name="volume-up"
                    size={24}
                    color={isFocused ? "#4CAF50" : "#fff"}
                  />
                </Pressable>
              )}
            </SpatialNavigationFocusableView>

            <SpatialNavigationFocusableView>
              {({ isFocused }) => (
                <Pressable
                  style={[
                    styles.controlBtnRect,
                    muted && styles.controlBtnActive,
                    isFocused && styles.controlBtnFocused,
                  ]}
                  focusable
                  accessibilityRole="button"
                  accessibilityLabel={muted ? "Unmute" : "Mute"}
                  onPress={handleToggleMute}
                >
                  <FontAwesome
                    name="volume-off"
                    size={24}
                    color={muted || isFocused ? "#4CAF50" : "#fff"}
                  />
                </Pressable>
              )}
            </SpatialNavigationFocusableView>

            <SpatialNavigationFocusableView>
              {({ isFocused }) => (
                <Pressable
                  style={[
                    styles.controlBtnRect,
                    repeat && styles.controlBtnActive,
                    isFocused && styles.controlBtnFocused,
                  ]}
                  focusable
                  accessibilityRole="button"
                  accessibilityLabel="Toggle repeat"
                  onPress={handleToggleRepeat}
                >
                  <FontAwesome
                    name="repeat"
                    size={22}
                    color={repeat || isFocused ? "#4CAF50" : "#fff"}
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
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
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
  moshafMeta: {
    fontSize: 14,
    color: "#888",
    marginTop: 4,
  },
  arabicText: {
    textAlign: "right",
    writingDirection: "rtl",
  },
  playlistContainer: {
    paddingHorizontal: 20,
    paddingTop: 6,
  },
  surahCard: {
    flex: 1,
    backgroundColor: "#1E1E1E",
    margin: 8,
    padding: 14,
    borderRadius: 8,
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
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
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
  surahMeta: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  playerControls: {
    padding: 20,
    backgroundColor: "#1E1E1E",
    borderTopWidth: 2,
    borderTopColor: "#4CAF50",
    alignItems: "center",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  nowPlaying: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 15,
  },
  controlsMeta: {
    fontSize: 13,
    color: "#AAA",
    marginBottom: 12,
  },
  spectrumRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 4,
    marginBottom: 16,
    height: 40,
  },
  spectrumBar: {
    width: 6,
    height: 40,
    borderRadius: 3,
    backgroundColor: "#4CAF50",
    opacity: 0.9,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  controlBtnRect: {
    width: 64,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  controlBtnRectWide: {
    width: 100,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#444",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  controlBtnFocused: {
    borderColor: "#4CAF50",
    backgroundColor: "#2E2E2E",
    transform: [{ scale: 1.1 }],
  },
  controlBtnActive: {
    borderColor: "#4CAF50",
    backgroundColor: "#1E1E1E",
  },
});

type SurahItemProps = {
  id: number;
  name: string;
  englishName: string;
  revelationType: string;
  ayahCount: number;
  selected: boolean;
  preferredFocus: boolean;
  onPress: (id: number) => void;
};

const SurahItem = memo(
  ({
    id,
    name,
    englishName,
    revelationType,
    ayahCount,
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
          <Text
            style={[styles.surahName, isArabicText(name) && styles.arabicText]}
          >
            {name}
          </Text>
          <Text style={styles.surahEnglishName}>{englishName}</Text>
          <Text style={styles.surahMeta}>
            {revelationType} • {ayahCount} verses
          </Text>
        </Pressable>
      )}
    </SpatialNavigationFocusableView>
  )
);
