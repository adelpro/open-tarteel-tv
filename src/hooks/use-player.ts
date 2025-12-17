import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRoute, useFocusEffect, RouteProp } from "@react-navigation/native";
import { AudioModule, createAudioPlayer, AudioPlayer } from "expo-audio";
import { Reciter, Surah } from "../types";
import { SURAHS } from "../constants/surahs";
import { getAllReciters } from "../services/api";

type PlayerScreenRouteProp = RouteProp<
  { PlayerScreen: { reciter?: Reciter; reciterId?: number; surahId?: number } },
  "PlayerScreen"
>;

export function usePlayer() {
  const route = useRoute<PlayerScreenRouteProp>();

  /** Audio player ref */
  const playerRef = useRef<AudioPlayer | null>(null);
  const currentUrlRef = useRef<string | null>(null);

  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  /** Core state */
  const [reciter, setReciter] = useState<Reciter | null>(
    route.params?.reciter ?? null
  );
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [initialSurahFromDeepLink, setInitialSurahFromDeepLink] =
    useState(false);

  /** Playback options */
  const [repeat, setRepeat] = useState(false);

  /** Sorted playlist */
  const playlistData: Surah[] = useMemo(
    () => SURAHS.slice().sort((a, b) => a.id - b.id),
    []
  );

  /** Unload player */
  const unloadAudio = useCallback(async () => {
    if (!playerRef.current) return;

    try {
      await playerRef.current.remove();
    } catch (err) {
      console.error("[usePlayer] Error unloading player:", err);
    } finally {
      playerRef.current = null;
      currentUrlRef.current = null;
      setIsPlaying(false);
    }
  }, []);

  /** Load and play audio */
  const loadAndPlay = useCallback(
    async (url: string) => {
      try {
        if (currentUrlRef.current === url && playerRef.current) {
          await playerRef.current.play();
          setIsPlaying(true);
          return;
        }

        await unloadAudio();

        if (AudioModule?.setAudioModeAsync) {
          await AudioModule.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            shouldDuckAndroid: true,
          } as any);
        }

        const player = createAudioPlayer({ uri: url });
        playerRef.current = player;
        currentUrlRef.current = url;

        player.addListener?.("playbackStatusUpdate", (status) => {
          if (!status) return;

          setPosition(status.currentTime ?? 0);
          setDuration(status.duration ?? 0);
          setIsPlaying(status.playing);

          if (status.didJustFinish) {
            setIsPlaying(false);
            onPlaybackEndRef.current?.();
          }
        });

        await player.play();
        setIsPlaying(true);
      } catch (err) {
        console.error("[usePlayer] Error playing audio:", err);
        throw err;
      }
    },
    [unloadAudio]
  );

  /** Handle deep linking */
  useEffect(() => {
    const loadFromDeepLink = async () => {
      const reciterId = route.params?.reciterId;
      const surahId = route.params?.surahId;

      if (!reciter && reciterId) {
        const reciters = await getAllReciters();
        const foundReciter = reciters.find((r) => r.id === reciterId) || null;
        if (foundReciter) {
          setReciter(foundReciter);
          if (surahId) {
            await handleSurahPress(surahId, foundReciter);
            setInitialSurahFromDeepLink(true);
          }
        }
      }
    };
    loadFromDeepLink();
  }, [reciter, route]);

  /** Auto-select first surah if none selected */
  useEffect(() => {
    if (!reciter || selectedSurah !== null || initialSurahFromDeepLink) return;
    if (!playlistData.length) return;
    setSelectedSurah(playlistData[0].id);
  }, [reciter, selectedSurah, initialSurahFromDeepLink, playlistData]);

  /** Play specific surah */
  const handleSurahPress = useCallback(
    async (surahId: number, reciterOverride?: Reciter | null) => {
      const effectiveReciter = reciterOverride ?? reciter;
      if (!effectiveReciter) return;

      setSelectedSurah(surahId);

      const audioUrl = effectiveReciter.moshaf.playlist.find(
        (item) => parseInt(item.surahId) === surahId
      )?.link;
      if (!audioUrl)
        return console.warn(`[usePlayer] No audio URL for surah ${surahId}`);

      await loadAndPlay(audioUrl);
    },
    [reciter, loadAndPlay]
  );

  /** Play/pause */
  const handlePlayPause = useCallback(async () => {
    if (!selectedSurah) return;
    if (!currentUrlRef.current) return handleSurahPress(selectedSurah);

    if (isPlaying) {
      await playerRef.current?.pause();
      setIsPlaying(false);
    } else {
      await playerRef.current?.play();
      setIsPlaying(true);
    }
  }, [selectedSurah, isPlaying, handleSurahPress]);

  /** Previous/Next */
  const handlePrevious = useCallback(async () => {
    if (!selectedSurah) return;
    const index = playlistData.findIndex((s) => s.id === selectedSurah);
    if (index > 0) await handleSurahPress(playlistData[index - 1].id);
  }, [selectedSurah, playlistData, handleSurahPress]);

  const handleNext = useCallback(async () => {
    if (!selectedSurah) return;
    const index = playlistData.findIndex((s) => s.id === selectedSurah);
    if (index < playlistData.length - 1)
      await handleSurahPress(playlistData[index + 1].id);
  }, [selectedSurah, playlistData, handleSurahPress]);

  /** Auto-play next or repeat */
  const onPlaybackEndRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    onPlaybackEndRef.current = () => {
      if (repeat && selectedSurah) handleSurahPress(selectedSurah);
      else handleNext();
    };
  }, [repeat, selectedSurah, handleSurahPress, handleNext]);

  /** Toggle repeat */
  const handleToggleRepeat = useCallback(() => setRepeat((prev) => !prev), []);

  /** Clean up on screen blur */
  useFocusEffect(useCallback(() => () => unloadAudio(), [unloadAudio]));

  return {
    playlistData,
    reciter,
    selectedSurah,
    isPlaying,
    repeat,
    position,
    duration,
    handleSurahPress,
    handlePlayPause,
    handlePrevious,
    handleNext,

    handleToggleRepeat,
  };
}

export type PlayerState = ReturnType<typeof usePlayer>;
