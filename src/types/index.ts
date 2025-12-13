// TypeScript type definitions

export enum LinkSource {
  MP3QURAN = "mp3quran",
}

export enum Riwaya {
  HAFS_A_ASIM = "hafs-a-asim",
  WARSH_AN_NAFI = "warsh-an-nafi",
  QALUN_AN_NAFI = "qalun-an-nafi",
  ALDURI_AN_ALKAISSAI = "alduri-an-alkaissai",
}

export interface Surah {
  id: number;
  name: string;
  englishName: string;
  revelationType: string;
  ayahCount: number;
}

export interface PlaylistItem {
  surahId: string;
  link: string;
}

export type Playlist = PlaylistItem[];

export interface Moshaf {
  id: number;
  name: string;
  riwaya: Riwaya;
  server: string;
  surah_total: number;
  playlist: Playlist;
}

export interface Reciter {
  id: number;
  name: string;
  source: LinkSource;
  moshaf: Moshaf;
}

// MP3Quran API response types
export interface MP3APIMoshaf {
  id: number;
  name: string;
  server: string;
  surah_total: number;
  surah_list: string;
  moshaf_type: number;
}

export interface MP3APIReciter {
  id: number;
  name: string;
  letter: string;
  moshaf: MP3APIMoshaf[];
}

export interface mp3QuranAPiResponse {
  reciters: MP3APIReciter[];
}
