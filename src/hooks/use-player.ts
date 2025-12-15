import { useCallback, useEffect, useMemo, useState } from "react";
import { useRoute, useFocusEffect } from "@react-navigation/native";
import { Reciter, Surah } from "../types";
import { SURAHS } from "../constants/surahs";
import { getAllReciters } from "../services/api";
import { audioService } from "../services/AudioService";

export function usePlayer() {
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
  const [initialSurahFromDeepLink, setInitialSurahFromDeepLink] =
    useState(false);

  const playlistData: Surah[] = useMemo(
    () => SURAHS.slice().sort((a, b) => a.id - b.id),
    []
  );

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

  const handleSurahPress = useCallback(
    async (surahId: number, reciterOverride?: Reciter | null) => {
      const effectiveReciter = reciterOverride ?? reciter;
      if (!effectiveReciter) {
        return;
      }
      setSelectedSurah(surahId);
      const audioUrl = effectiveReciter.moshaf.playlist.find(
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
            await handleSurahPress(surahId, found);
            setInitialSurahFromDeepLink(true);
          }
        }
      }
    };
    maybeLoadFromDeepLink();
  }, [reciter, route, handleSurahPress]);

  useEffect(() => {
    if (!reciter || selectedSurah !== null || initialSurahFromDeepLink) {
      return;
    }
    if (!playlistData.length) {
      return;
    }
    const first = playlistData[0];
    setSelectedSurah(first.id);
    setIsPlaying(false);
  }, [reciter, selectedSurah, initialSurahFromDeepLink, playlistData]);

  const handlePlayPause = useCallback(async () => {
    try {
      await audioService.togglePlayPause();
      setIsPlaying(audioService.getIsPlaying());
    } catch (error) {
      console.error("Error toggling playback:", error);
    }
  }, []);

  const handlePrevious = useCallback(async () => {
    if (!selectedSurah) return;
    const currentIndex = playlistData.findIndex((s) => s.id === selectedSurah);
    if (currentIndex > 0) {
      await handleSurahPress(playlistData[currentIndex - 1].id);
    }
  }, [selectedSurah, playlistData, handleSurahPress]);

  const handleNext = useCallback(async () => {
    if (!selectedSurah) return;
    const currentIndex = playlistData.findIndex((s) => s.id === selectedSurah);
    if (currentIndex < playlistData.length - 1) {
      await handleSurahPress(playlistData[currentIndex + 1].id);
    }
  }, [selectedSurah, playlistData, handleSurahPress]);

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

  const handleToggleRepeat = useCallback(() => {
    const next = !repeat;
    setRepeat(next);
    audioService.setRepeat(next);
  }, [repeat]);

  return {
    playlistData,
    reciter,
    selectedSurah,
    isPlaying,
    volume,
    repeat,
    muted,
    handleSurahPress,
    handlePlayPause,
    handlePrevious,
    handleNext,
    handleVolumeChange,
    handleToggleMute,
    handleToggleRepeat,
  };
}

export type PlayerState = ReturnType<typeof usePlayer>;
