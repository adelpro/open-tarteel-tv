/**
 * Pure label helper: the status text depends only on whether audio is playing.
 */
export const getPlayerStatusLabel = (
  isPlaying: boolean,
): 'now_playing' | 'selected_surah' =>
  isPlaying ? 'now_playing' : 'selected_surah';
