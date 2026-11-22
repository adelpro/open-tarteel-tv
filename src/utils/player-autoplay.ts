import type { Playlist } from '../types';

export type AutoplayInput = {
  reciterId: string | null;
  selectedSurah: number | null;
  /** Deep-link surah id; takes precedence over `selectedSurah` when valid. */
  explicitSurahId?: number | null;
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
  explicitSurahId,
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

  const isAvailable = (surahId: number | null | undefined) =>
    surahId !== null &&
    surahId !== undefined &&
    playlist.some((item) => Number(item.surahId) === surahId);

  // The deep link is authoritative, then the in-app selection, then the first
  // available item — any id missing from this reciter's playlist is skipped.
  const preferred =
    [explicitSurahId, selectedSurah].find(isAvailable) ??
    Number(playlist[0].surahId);

  return { shouldPlay: true, surahId: preferred };
};
