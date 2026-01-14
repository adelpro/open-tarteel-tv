export type ItqanReciterResponse = {
  results: {
    id: number;
    name: string;
    recitations_count: number;
  }[];
};

export type ItqanRecitationResponse = {
  results: {
    surah_number: number;
    audio_url: string;
  }[];
};

export type ItqanSurahResponse = {
  results: {
    surah_number: number;
    surah_name: string;
    surah_name_en: string;
    audio_url: string;
    duration_ms: number;
    size_bytes: number;
    revelation_order: number;
    revelation_place: string;
    ayahs_count: number;
    ayahs_timings: any[]; // can refine if needed
  }[];
  count: number;
};
