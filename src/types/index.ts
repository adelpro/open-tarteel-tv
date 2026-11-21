// TypeScript type definitions

export enum LinkSource {
  MP3QURAN = 'mp3quran',
  ITQAN = 'itqan',
  QURANAI = 'qurani',
  QURAN_FOUNDATION = 'quran-foundation',
  MP3QURAN_V4 = 'mp3quran-v4',
}

export enum Riwaya {
  HAFS_A_ASIM = 'hafs-a-asim',
  WARSH_AN_NAFI = 'warsh-an-nafi',
  QALUN_AN_NAFI = 'qalun-an-nafi',
  ALDURI_AN_ALKAISSAI = 'alduri-an-alkaissai',
  KHALAF_AN_HAMZAH = 'khalaf-an-hamzah',
  AL_BAZZI_AN_IBN_KATHIR = 'al-bazzi-an-ibn-kathir',
  AL_SOOSI_AN_ABU_AMR = 'al-soosi-an-abu-amr',
  AL_DOORI_AN_ABU_AMR = 'al-doori-an-abu-amr',
  SHUABA_AN_ASIM = 'shuaba-an-asim',
  IBN_ZAKWAN = 'ibn-zakwan',
  HISHAM = 'hisham',
  IBN_JAMMAZ = 'ibn-jammaz',
  YAQOUB = 'yaqoub',
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
  id: string;
  name: string;
  source: LinkSource;
  moshaf: Moshaf;
};
