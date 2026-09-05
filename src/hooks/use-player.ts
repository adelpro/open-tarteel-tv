import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { RouteProp, useRoute } from '@react-navigation/native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

import { SURAHS } from '../constants/surahs';
import {
  cacheAudio,
  getCachedAudioPath,
  preFetchAudio,
} from '../services/audio-cache';
import { getItqanPlaylist } from '../services/reciters/itqan.adapter';
import { LinkSource, Reciter, Surah } from '../types';

type PlayerScreenRouteProp = RouteProp<
  { PlayerScreen: { reciter?: Reciter; reciterId?: number; surahId?: number } },
  'PlayerScreen'
>;

export function usePlayer() {
  const route = useRoute<PlayerScreenRouteProp>();
  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);

  const { currentTime, duration, playing: isPlaying, didJustFinish } = status;

  const [reciter, setReciter] = useState<Reciter | null>(
    route.params?.reciter ?? null,
  );
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [repeat, setRepeat] = useState(false);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [playlistError, setPlaylistError] = useState(false);
  const [playlistRetry, setPlaylistRetry] = useState(0);

  const currentUrlRef = useRef<string | null>(null);
  const onPlaybackEndRef = useRef<(() => void) | null>(null);
  // Reciters whose playlist was already attempted, so an empty/errored result
  // does not retrigger the lazy load on every render.
  const playlistAttemptedRef = useRef<Set<string>>(new Set());

  const playlistData: Surah[] = useMemo(
    () => SURAHS.slice().sort((a, b) => a.id - b.id),
    [],
  );

  useEffect(() => {
    if (!reciter || selectedSurah !== null) return;
    if (!playlistData.length) return;
    setSelectedSurah(playlistData[0].id);
  }, [reciter, selectedSurah, playlistData]);

  // Lazy-load the Itqan playlist (audio URLs) on first open.
  // mp3quran playlists ship with the reciter metadata.
  useEffect(() => {
    if (!reciter) return;
    if (reciter.source !== LinkSource.ITQAN) return;
    if (reciter.moshaf.playlist.length > 0) return;
    if (playlistAttemptedRef.current.has(reciter.id)) return;

    playlistAttemptedRef.current.add(reciter.id);
    let cancelled = false;
    setPlaylistLoading(true);
    setPlaylistError(false);

    getItqanPlaylist(reciter)
      .then((playlist) => {
        if (cancelled) return;
        setReciter((prev) =>
          prev ? { ...prev, moshaf: { ...prev.moshaf, playlist } } : prev,
        );
      })
      .catch(() => {
        if (!cancelled) setPlaylistError(true);
      })
      .finally(() => {
        if (!cancelled) setPlaylistLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reciter, playlistRetry]);

  const retryLoadPlaylist = useCallback(() => {
    if (reciter) {
      playlistAttemptedRef.current.delete(reciter.id);
    }
    setPlaylistRetry((prev) => prev + 1);
  }, [reciter]);

  const handleSurahPress = useCallback(
    async (surahId: number, reciterOverride?: Reciter | null) => {
      const effectiveReciter = reciterOverride ?? reciter;
      if (!effectiveReciter) return;

      setSelectedSurah(surahId);

      const playlistItem = effectiveReciter.moshaf.playlist.find(
        (item) => parseInt(item.surahId, 10) === surahId,
      );

      if (!playlistItem) return;

      const remoteUrl = playlistItem.link;
      const cachedPath = await getCachedAudioPath(
        effectiveReciter.id.toString(),
        surahId,
      );

      const audioToPlay = cachedPath ?? remoteUrl;

      if (currentUrlRef.current === audioToPlay && isPlaying) {
        return;
      }

      try {
        player.replace({ uri: audioToPlay });
        currentUrlRef.current = audioToPlay;
        player.play();

        if (!cachedPath) {
          cacheAudio(effectiveReciter.id.toString(), surahId, remoteUrl).catch(
            () => {},
          );
        }

        preFetchAudio(
          effectiveReciter.id.toString(),
          effectiveReciter.moshaf.playlist,
          surahId,
        );
      } catch {}
    },
    [reciter, player, isPlaying],
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

  const handleSeekForward = useCallback(
    (seconds: number = 10) => {
      if (!currentUrlRef.current) return;
      const next = Math.min(player.currentTime + seconds, player.duration);
      player.seekTo(next);
    },
    [player],
  );

  const handleSeekBackward = useCallback(
    (seconds: number = 10) => {
      if (!currentUrlRef.current) return;
      const prev = Math.max(player.currentTime - seconds, 0);
      player.seekTo(prev);
    },
    [player],
  );

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
    playlistLoading,
    playlistError,
    retryLoadPlaylist,
    handleSurahPress,
    handlePlayPause,
    handlePrevious,
    handleNext,
    handleToggleRepeat,
    setReciter,
    handleSeekBackward,
    handleSeekForward,
  };
}

export type PlayerState = ReturnType<typeof usePlayer>;
