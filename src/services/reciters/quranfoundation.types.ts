export interface QuranFoundationQirat {
  name: string | null;
}

export interface QuranFoundationTranslatedName {
  name: string;
}

export interface QuranFoundationChapterReciter {
  id: number;
  name: string;
  translated_name?: QuranFoundationTranslatedName | null;
  qirat?: QuranFoundationQirat | null;
}

export interface QuranFoundationChapterRecitersResponse {
  reciters: QuranFoundationChapterReciter[];
}

export interface QuranFoundationAudioFile {
  chapter_id: number;
  audio_url: string;
}

export interface QuranFoundationChapterAudioResponse {
  audio_files: QuranFoundationAudioFile[];
}
