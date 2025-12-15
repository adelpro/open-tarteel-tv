import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { View, Text, StyleSheet } from "react-native";
import type { FlatList as RNFlatList } from "react-native";
import { useRoute, useFocusEffect } from "@react-navigation/native";
import { SURAHS } from "../constants/surahs";
import { Reciter } from "../types";
import { getAllReciters } from "../services/api";
import { audioService } from "../services/AudioService";
import Player from "../components/player";
import Playlist from "../components/play-list";

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
  const isCurrentSurahNameArabic = isArabicText(currentSurah?.name ?? "");

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
        <Player
          reciter={reciter}
          currentSurah={
            currentSurah
              ? {
                  id: currentSurah.id,
                  englishName: currentSurah.englishName,
                  name: currentSurah.name,
                }
              : null
          }
          hasSelection={hasSelection}
          isPlaying={isPlaying}
          volume={volume}
          muted={muted}
          repeat={repeat}
          controlsDisabled={controlsDisabled}
          isCurrentSurahNameArabic={isCurrentSurahNameArabic}
          styles={styles}
          onPlayPause={handlePlayPause}
          onStop={handleStop}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onVolumeChange={handleVolumeChange}
          onToggleMute={handleToggleMute}
          onToggleRepeat={handleToggleRepeat}
        />

        <Playlist
          styles={styles}
          playlistRef={playlistRef}
          playlistData={playlistData}
          selectedSurah={selectedSurah}
          onSurahPress={handleSurahPress}
        />
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
    backgroundColor: "#2E7D32",
    borderColor: "#4CAF50",
    transform: [{ scale: 1.08 }],
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  surahCardSelected: {
    backgroundColor: "#4CAF50",
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
