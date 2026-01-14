// TypeScript type definitions

export enum LinkSource {
  MP3QURAN = "mp3quran",
  ITQAN = "itqan",
}

export enum Riwaya {
  HAFS_A_ASIM = "hafs-a-asim",
  WARSH_AN_NAFI = "warsh-an-nafi",
  QALUN_AN_NAFI = "qalun-an-nafi",
  ALDURI_AN_ALKAISSAI = "alduri-an-alkaissai",
}

export type Surah = {
  id: number;
  name: string;
  englishName: string;
  revelationType: string;
  ayahCount: number;
};

export type PlaylistItem = {
  surahId: string;
  link: string;
};

export type Playlist = PlaylistItem[];

export type Moshaf = {
  id: number;
  name: string;
  riwaya: Riwaya;
  server: string;
  surah_total: number;
  playlist: Playlist;
};

export type Reciter = {
  id: number;
  name: string;
  source: LinkSource;
  moshaf: Moshaf;
};
