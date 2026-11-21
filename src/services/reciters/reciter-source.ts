import type { Playlist, Reciter } from '../../types';

export type ReciterSource = {
  readonly source: string;
  getReciters(lang: 'ar' | 'en', signal?: AbortSignal): Promise<Reciter[]>;
  getPlaylist?(
    reciter: Reciter,
    lang: 'ar' | 'en',
    signal?: AbortSignal,
  ): Promise<Playlist>;
};
