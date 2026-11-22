import type { Playlist } from '../types';

export type AutoplayInput = {
  reciterId: string | null;
  selectedSurah: number | null;
  playlist: Playlist;
  playlistLoading: boolean;
  alreadyAttempted: boolean;
};

export type AutoplayDecision = {
  shouldPlay: boolean;
  surahId: number | null;
};

/**
 * Pure decision helper for the player's initial autoplay: decide whether to
 * start playback and which surah to start from, based only on the supplied
 * snapshot. No React, navigation or Expo dependencies.
 */
export const resolveAutoplay = ({
  reciterId,
  selectedSurah,
  playlist,
  playlistLoading,
  alreadyAttempted,
}: AutoplayInput): AutoplayDecision => {
  if (
    !reciterId ||
    alreadyAttempted ||
    playlistLoading ||
    playlist.length === 0
  ) {
    return { shouldPlay: false, surahId: null };
  }

  const hasSelectedSurah =
    selectedSurah !== null &&
    playlist.some((item) => Number(item.surahId) === selectedSurah);

  return {
    shouldPlay: true,
    surahId: hasSelectedSurah ? selectedSurah : Number(playlist[0].surahId),
  };
};
