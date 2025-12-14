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
import type { FlatList as RNFlatList } from "react-native";
import { useRoute, useFocusEffect } from "@react-navigation/native";
import {
  SpatialNavigationFocusableView,
  SpatialNavigationView,
} from "react-tv-space-navigation";
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
  const playlistRef = useRef<RNFlatList<any> | null>(null);

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

  const hasSelection = selectedSurah !== null;
  const currentSurah = hasSelection
    ? SURAHS.find((s) => s.id === selectedSurah)
    : null;
  const controlsDisabled = !hasSelection;

  useEffect(() => {
    if (!selectedSurah || !playlistRef.current) return;
    const index = playlistData.findIndex((s) => s.id === selectedSurah);
    if (index === -1) return;
    try {
      playlistRef.current.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5,
      });
    } catch {
      // ignored
    }
  }, [selectedSurah, playlistData]);

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

      <View style={styles.mainContent}>
        <View style={styles.playerColumn}>
          <View style={styles.metadataCard}>
            {hasSelection ? (
              <>
                <Text style={styles.metadataTitle}>
                  {currentSurah?.englishName ?? "Select a surah"}
                </Text>
                <Text
                  style={[
                    styles.metadataSubtitle,
                    isArabicText(currentSurah?.name ?? "") && styles.arabicText,
                  ]}
                >
                  {currentSurah?.name}
                </Text>
                <Text style={styles.metadataMeta}>
                  {reciter.name} • {reciter.moshaf.name}
                </Text>
                <Text style={styles.metadataMeta}>
                  Track {currentSurah?.id ?? "-"} of{" "}
                  {reciter.moshaf.surah_total}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.metadataTitle}>Select a surah</Text>
                <Text style={styles.metadataSubtitle}>
                  Use the playlist on the right to start
                </Text>
              </>
            )}
          </View>

          <View style={styles.playerArea}>
            <View style={styles.playerControls}>
              <Text style={styles.nowPlaying}>
                {hasSelection
                  ? `Now Playing: ${currentSurah?.englishName ?? ""}`
                  : "Select a surah to start playing"}
              </Text>
              <Text style={styles.controlsMeta}>
                {hasSelection
                  ? `Volume ${Math.round(volume * 100)}% ${
                      muted ? "(Muted)" : ""
                    } • Repeat ${repeat ? "On" : "Off"}`
                  : "Playback controls will be enabled once a surah is selected"}
              </Text>
              <AudioSpectrum playing={hasSelection && isPlaying} />
              <SpatialNavigationView direction="horizontal">
                <View style={styles.controlsRow}>
                  <SpatialNavigationFocusableView>
                    {({ isFocused }) => (
                      <Pressable
                        style={[
                          styles.controlBtnRect,
                          controlsDisabled && styles.controlBtnDisabled,
                          isFocused &&
                            !controlsDisabled &&
                            styles.controlBtnFocused,
                        ]}
                        focusable={!controlsDisabled}
                        disabled={controlsDisabled}
                        accessibilityRole="button"
                        accessibilityLabel="Stop"
                        onPress={handleStop}
                      >
                        <FontAwesome
                          name="stop"
                          size={24}
                          color={
                            isFocused && !controlsDisabled ? "#4CAF50" : "#fff"
                          }
                        />
                      </Pressable>
                    )}
                  </SpatialNavigationFocusableView>

                  <SpatialNavigationFocusableView>
                    {({ isFocused }) => (
                      <Pressable
                        style={[
                          styles.controlBtnRect,
                          controlsDisabled && styles.controlBtnDisabled,
                          isFocused &&
                            !controlsDisabled &&
                            styles.controlBtnFocused,
                        ]}
                        focusable={!controlsDisabled}
                        disabled={controlsDisabled}
                        accessibilityRole="button"
                        accessibilityLabel="Previous"
                        onPress={handlePrevious}
                      >
                        <FontAwesome
                          name="step-backward"
                          size={28}
                          color={
                            isFocused && !controlsDisabled ? "#4CAF50" : "#fff"
                          }
                        />
                      </Pressable>
                    )}
                  </SpatialNavigationFocusableView>

                  <SpatialNavigationFocusableView>
                    {({ isFocused }) => (
                      <Pressable
                        style={[
                          styles.controlBtnRectWide,
                          controlsDisabled && styles.controlBtnDisabled,
                          isFocused &&
                            !controlsDisabled &&
                            styles.controlBtnFocused,
                        ]}
                        focusable={!controlsDisabled}
                        disabled={controlsDisabled}
                        accessibilityRole="button"
                        accessibilityLabel={isPlaying ? "Pause" : "Play"}
                        onPress={handlePlayPause}
                      >
                        <FontAwesome
                          name={isPlaying ? "pause" : "play"}
                          size={32}
                          color={
                            isFocused && !controlsDisabled ? "#4CAF50" : "#fff"
                          }
                        />
                      </Pressable>
                    )}
                  </SpatialNavigationFocusableView>

                  <SpatialNavigationFocusableView>
                    {({ isFocused }) => (
                      <Pressable
                        style={[
                          styles.controlBtnRect,
                          controlsDisabled && styles.controlBtnDisabled,
                          isFocused &&
                            !controlsDisabled &&
                            styles.controlBtnFocused,
                        ]}
                        focusable={!controlsDisabled}
                        disabled={controlsDisabled}
                        accessibilityRole="button"
                        accessibilityLabel="Next"
                        onPress={handleNext}
                      >
                        <FontAwesome
                          name="step-forward"
                          size={28}
                          color={
                            isFocused && !controlsDisabled ? "#4CAF50" : "#fff"
                          }
                        />
                      </Pressable>
                    )}
                  </SpatialNavigationFocusableView>

                  <SpatialNavigationFocusableView>
                    {({ isFocused }) => (
                      <Pressable
                        style={[
                          styles.controlBtnRect,
                          controlsDisabled && styles.controlBtnDisabled,
                          isFocused &&
                            !controlsDisabled &&
                            styles.controlBtnFocused,
                        ]}
                        focusable={!controlsDisabled}
                        disabled={controlsDisabled}
                        accessibilityRole="button"
                        accessibilityLabel="Volume down"
                        onPress={() => handleVolumeChange(-0.1)}
                      >
                        <FontAwesome
                          name="volume-down"
                          size={24}
                          color={
                            isFocused && !controlsDisabled ? "#4CAF50" : "#fff"
                          }
                        />
                      </Pressable>
                    )}
                  </SpatialNavigationFocusableView>

                  <SpatialNavigationFocusableView>
                    {({ isFocused }) => (
                      <Pressable
                        style={[
                          styles.controlBtnRect,
                          controlsDisabled && styles.controlBtnDisabled,
                          isFocused &&
                            !controlsDisabled &&
                            styles.controlBtnFocused,
                        ]}
                        focusable={!controlsDisabled}
                        disabled={controlsDisabled}
                        accessibilityRole="button"
                        accessibilityLabel="Volume up"
                        onPress={() => handleVolumeChange(0.1)}
                      >
                        <FontAwesome
                          name="volume-up"
                          size={24}
                          color={
                            isFocused && !controlsDisabled ? "#4CAF50" : "#fff"
                          }
                        />
                      </Pressable>
                    )}
                  </SpatialNavigationFocusableView>

                  <SpatialNavigationFocusableView>
                    {({ isFocused }) => (
                      <Pressable
                        style={[
                          styles.controlBtnRect,
                          controlsDisabled && styles.controlBtnDisabled,
                          muted && styles.controlBtnActive,
                          isFocused &&
                            !controlsDisabled &&
                            styles.controlBtnFocused,
                        ]}
                        focusable={!controlsDisabled}
                        disabled={controlsDisabled}
                        accessibilityRole="button"
                        accessibilityLabel={muted ? "Unmute" : "Mute"}
                        onPress={handleToggleMute}
                      >
                        <FontAwesome
                          name="volume-off"
                          size={24}
                          color={
                            muted || (isFocused && !controlsDisabled)
                              ? "#4CAF50"
                              : "#fff"
                          }
                        />
                      </Pressable>
                    )}
                  </SpatialNavigationFocusableView>

                  <SpatialNavigationFocusableView>
                    {({ isFocused }) => (
                      <Pressable
                        style={[
                          styles.controlBtnRect,
                          controlsDisabled && styles.controlBtnDisabled,
                          repeat && styles.controlBtnActive,
                          isFocused &&
                            !controlsDisabled &&
                            styles.controlBtnFocused,
                        ]}
                        focusable={!controlsDisabled}
                        disabled={controlsDisabled}
                        accessibilityRole="button"
                        accessibilityLabel="Toggle repeat"
                        onPress={handleToggleRepeat}
                      >
                        <FontAwesome
                          name="repeat"
                          size={22}
                          color={
                            repeat || (isFocused && !controlsDisabled)
                              ? "#4CAF50"
                              : "#fff"
                          }
                        />
                      </Pressable>
                    )}
                  </SpatialNavigationFocusableView>
                </View>
              </SpatialNavigationView>
            </View>
          </View>
        </View>

        <View style={styles.playlistPanel}>
          <View style={styles.playlistHeaderRow}>
            <Text style={styles.playlistTitle}>Playlist</Text>
          </View>
          <View style={styles.playlistBody}>
            <SpatialNavigationView direction="vertical">
              <FlatList
                ref={playlistRef}
                data={playlistData}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                initialNumToRender={18}
                maxToRenderPerBatch={18}
                windowSize={10}
                removeClippedSubviews
                contentContainerStyle={styles.playlistContent}
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
            </SpatialNavigationView>
          </View>
        </View>
      </View>
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
  mainContent: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  playerColumn: {
    flex: 1,
    justifyContent: "center",
  },
  playerArea: {
    marginTop: 12,
  },
  playlistPanel: {
    height: "100%",
    marginLeft: 12,
    width: 320,
    backgroundColor: "#181818",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#262626",
    overflow: "hidden",
  },
  arabicText: {
    textAlign: "right",
    writingDirection: "rtl",
  },
  playlistContainer: {
    flex: 1,
    paddingVertical: 16,
  },
  playlistHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#262626",
  },
  playlistTitle: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
  },
  playlistBody: {
    flex: 1,
  },
  playlistContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  surahCard: {
    width: 280,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#181818",
    borderWidth: 1,
    borderColor: "#262626",
  },
  surahCardFocused: {
    borderWidth: 2,
    backgroundColor: "#1F2A1F",
    borderColor: "#4CAF50",
    transform: [{ scale: 1.06 }],
    shadowColor: "#4CAF50",
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  surahCardSelected: {
    backgroundColor: "#2E7D32",
    borderColor: "#4CAF50",
  },
  surahNumber: {
    fontSize: 12,
    fontWeight: "600",
    color: "#B0B0B0",
    marginRight: 12,
  },
  surahName: {
    fontSize: 14,
    color: "#fff",
    flexShrink: 1,
  },
  surahEnglishName: {
    fontSize: 13,
    color: "#EEE",
  },
  surahMeta: {
    fontSize: 12,
    color: "#888",
    marginTop: 0,
  },
  playerControls: {
    paddingHorizontal: 24,
    paddingVertical: 18,
    backgroundColor: "#1E1E1E",
    borderTopWidth: 2,
    borderTopColor: "#4CAF50",
    alignItems: "center",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  metadataCard: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  metadataTitle: {
    fontSize: 20,
    color: "#fff",
    marginBottom: 4,
  },
  metadataSubtitle: {
    fontSize: 16,
    color: "#DDD",
    marginBottom: 4,
  },
  metadataMeta: {
    fontSize: 12,
    color: "#AAA",
  },
  nowPlaying: {
    fontSize: 18,
    color: "#fff",
    marginBottom: 6,
  },
  controlsMeta: {
    fontSize: 12,
    color: "#AAA",
    marginBottom: 16,
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
    gap: 18,
  },
  controlBtnRect: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#232323",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  controlBtnRectWide: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#2F2F2F",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  controlBtnFocused: {
    borderColor: "#4CAF50",
    backgroundColor: "#2E2E2E",
    transform: [{ scale: 1.14 }],
    shadowColor: "#4CAF50",
    shadowOpacity: 0.7,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  controlBtnDisabled: {
    opacity: 0.4,
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
          <Text style={[styles.surahName]} numberOfLines={1}>
            {englishName}
          </Text>
        </Pressable>
      )}
    </SpatialNavigationFocusableView>
  )
);
