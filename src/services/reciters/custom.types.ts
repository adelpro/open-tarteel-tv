/**
 * Custom API – raw response types
 * Adapter-only. Never leak into domain.
 */

export type CustomApiReciter = {
  id: number;
  name: string;
  reciterName: string;
  audioUrl: string;
};

export type CustomApiResponse = {
  reciters: CustomApiReciter[];
};
