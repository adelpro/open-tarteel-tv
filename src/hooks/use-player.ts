import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { RouteProp, useRoute } from '@react-navigation/native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useTranslation } from 'react-i18next';

import { SURAHS } from '../constants/surahs';
import { findReciterById, getReciterPlaylist } from '../services/api';
import {
  cacheAudio,
  getCachedAudioPath,
  preFetchAudio,
} from '../services/audio-cache';
import { Reciter, Surah } from '../types';
import { resolveAutoplay } from '../utils/player-autoplay';

type PlayerScreenRouteProp = RouteProp<
  { PlayerScreen: { reciter?: Reciter; reciterId?: number; surahId?: number } },
  'PlayerScreen'
>;

export function usePlayer() {
  const route = useRoute<PlayerScreenRouteProp>();
  const routeReciterId = route.params?.reciterId;
  const explicitSurahId = route.params?.surahId ?? null;
  const { i18n } = useTranslation();
  const lang: 'ar' | 'en' = i18n.language === 'ar' ? 'ar' : 'en';
  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);

  const { currentTime, duration, playing: isPlaying, didJustFinish } = status;

  const [reciter, setReciter] = useState<Reciter | null>(
    route.params?.reciter ?? null,
  );
  // Eager default keeps the highlighted surah non-null on the first render,
  // so the playlist's legacy "start surah 1" fallback cannot race the deep link.
  const [selectedSurah, setSelectedSurah] = useState<number | null>(
    explicitSurahId ?? SURAHS[0].id,
  );
  const [repeat, setRepeat] = useState(false);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [playlistError, setPlaylistError] = useState(false);
  const [playlistRetry, setPlaylistRetry] = useState(0);

  const currentUrlRef = useRef<string | null>(null);
  const onPlaybackEndRef = useRef<(() => void) | null>(null);
  // Reciters whose playlist was already attempted, so an empty/errored result
  // does not retrigger the lazy load on every render.
  const playlistAttemptedRef = useRef<Set<string>>(new Set());
  // Reciters whose initial autoplay was already attempted: at most one attempt
  // per reciter visit, and never before the (possibly lazy) playlist resolves.
  const autoPlayAttemptedRef = useRef<Set<string>>(new Set());

  const playlistData: Surah[] = useMemo(
    () => SURAHS.slice().sort((a, b) => a.id - b.id),
    [],
  );

  // In-app navigation supplies the reciter object; a deep link only supplies
  // its id, so resolve that id from the cached catalog (or a fresh fetch).
  useEffect(() => {
    if (reciter || routeReciterId == null) return;
    let cancelled = false;

    findReciterById(routeReciterId, lang)
      .then((found) => {
        if (!cancelled && found) setReciter(found);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [reciter, routeReciterId, lang]);

  // Lazy-load playlists (audio URLs) on first open for sources that need it.
  // Other sources ship their playlist with the reciter metadata.
  useEffect(() => {
    if (!reciter) return;
    if (reciter.moshaf.playlist.length > 0) return;
    if (playlistAttemptedRef.current.has(reciter.id)) return;

    playlistAttemptedRef.current.add(reciter.id);
    let cancelled = false;
    setPlaylistLoading(true);
    setPlaylistError(false);

    getReciterPlaylist(reciter.source, reciter, lang)
      .then((playlist) => {
        if (cancelled || !playlist) return;
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
  }, [reciter, playlistRetry, lang]);

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

  // Start the chosen surah once per reciter visit, only when the playlist is
  // actually available (a lazy playlist may still be loading on first open).
  useEffect(() => {
    if (!reciter || autoPlayAttemptedRef.current.has(reciter.id)) return;

    const { shouldPlay, surahId } = resolveAutoplay({
      reciterId: reciter.id,
      selectedSurah,
      explicitSurahId,
      playlist: reciter.moshaf.playlist,
      playlistLoading,
      alreadyAttempted: autoPlayAttemptedRef.current.has(reciter.id),
    });

    if (!shouldPlay || surahId === null) return;

    autoPlayAttemptedRef.current.add(reciter.id);
    setSelectedSurah(surahId);
    handleSurahPress(surahId);
  }, [
    reciter,
    selectedSurah,
    explicitSurahId,
    playlistLoading,
    handleSurahPress,
  ]);

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
