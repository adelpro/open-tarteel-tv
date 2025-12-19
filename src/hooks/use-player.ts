import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRoute, RouteProp } from "@react-navigation/native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Reciter, Surah } from "../types";
import { SURAHS } from "../constants/surahs";

type PlayerScreenRouteProp = RouteProp<
  { PlayerScreen: { reciter?: Reciter; reciterId?: number; surahId?: number } },
  "PlayerScreen"
>;

export function usePlayer() {
  const route = useRoute<PlayerScreenRouteProp>();
  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);

  const { currentTime, duration, playing: isPlaying, didJustFinish } = status;

  const [reciter, setReciter] = useState<Reciter | null>(
    route.params?.reciter ?? null
  );
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [repeat, setRepeat] = useState(false);

  const currentUrlRef = useRef<string | null>(null);
  const onPlaybackEndRef = useRef<(() => void) | null>(null);

  const playlistData: Surah[] = useMemo(
    () => SURAHS.slice().sort((a, b) => a.id - b.id),
    []
  );

  useEffect(() => {
    if (!reciter || selectedSurah !== null) return;
    if (!playlistData.length) return;
    setSelectedSurah(playlistData[0].id);
  }, [reciter, selectedSurah, playlistData]);

  const handleSurahPress = useCallback(
    (surahId: number, reciterOverride?: Reciter | null) => {
      const effectiveReciter = reciterOverride ?? reciter;
      if (!effectiveReciter) return;

      setSelectedSurah(surahId);

      const audioUrl = effectiveReciter.moshaf.playlist.find(
        (item) => parseInt(item.surahId) === surahId
      )?.link;

      if (!audioUrl) {
        return;
      }

      if (currentUrlRef.current === audioUrl && isPlaying) {
        return;
      }

      try {
        player.replace({ uri: audioUrl });
        currentUrlRef.current = audioUrl;
        player.play();
      } catch (error) {
        // Error playing audio
      }
    },
    [reciter, player, isPlaying]
  );

  const handlePlayPause = useCallback(() => {
    if (!selectedSurah) return;

    if (!currentUrlRef.current) {
      handleSurahPress(selectedSurah);
      return;
    }

    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  }, [selectedSurah, isPlaying, player, handleSurahPress]);

  const handlePrevious = useCallback(() => {
    if (!selectedSurah) return;
    const index = playlistData.findIndex((s) => s.id === selectedSurah);
    if (index > 0) handleSurahPress(playlistData[index - 1].id);
  }, [selectedSurah, playlistData, handleSurahPress]);

  const handleNext = useCallback(() => {
    if (!selectedSurah) return;
    const index = playlistData.findIndex((s) => s.id === selectedSurah);
    if (index < playlistData.length - 1) {
      handleSurahPress(playlistData[index + 1].id);
    }
  }, [selectedSurah, playlistData, handleSurahPress]);

  useEffect(() => {
    onPlaybackEndRef.current = () => {
      if (repeat && selectedSurah) {
        player.seekTo(0);
        player.play();
      } else {
        handleNext();
      }
    };
  }, [repeat, selectedSurah, handleNext, player]);

  useEffect(() => {
    if (didJustFinish) {
      onPlaybackEndRef.current?.();
    }
  }, [didJustFinish]);

  const handleToggleRepeat = useCallback(() => setRepeat((prev) => !prev), []);

  return {
    playlistData,
    reciter,
    selectedSurah,
    isPlaying,
    repeat,
    position: currentTime,
    duration,
    handleSurahPress,
    handlePlayPause,
    handlePrevious,
    handleNext,
    handleToggleRepeat,
    setReciter,
  };
}

export type PlayerState = ReturnType<typeof usePlayer>;
