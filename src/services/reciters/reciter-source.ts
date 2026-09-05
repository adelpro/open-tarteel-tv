import { Reciter } from '../../types';

export type ReciterSource = {
  readonly source: string;
  getReciters(lang: 'ar' | 'en', signal?: AbortSignal): Promise<Reciter[]>;
};
