import { LinkSource } from '../types';

export type ItqanConfig = { baseUrl: string; apiKey?: string };
export type QuranAiConfig = { baseUrl: string };
export type QfConfig = {
  clientId?: string;
  clientSecret?: string;
  tokenUrl: string;
  apiBase: string;
  publicApiBase: string;
  rateLimitMs: number;
};
export type Mp3QuranV4Config = { enabled: boolean; baseUrl: string };

// Expo exposes only EXPO_PUBLIC_* variables at runtime and inlines them as
// build-time constants. Read each OTTV value exactly once, at module load, so
// adapters never touch process.env directly and behave consistently per build.
const ITQAN_BASE_URL =
  process.env.EXPO_PUBLIC_OTTV_ITQAN_BASE_URL ?? 'https://api.cms.itqan.dev';
const ITQAN_API_KEY = process.env.EXPO_PUBLIC_OTTV_ITQAN_API_KEY;

const QURANAI_BASE_URL =
  process.env.EXPO_PUBLIC_OTTV_QURANAI_BASE_URL ??
  'https://api.qurani.ai/gw/qh/v1';

const QF_CLIENT_ID = process.env.EXPO_PUBLIC_OTTV_QF_CLIENT_ID;
const QF_CLIENT_SECRET = process.env.EXPO_PUBLIC_OTTV_QF_CLIENT_SECRET;
const QF_TOKEN_URL =
  process.env.EXPO_PUBLIC_OTTV_QF_TOKEN_URL ??
  'https://oauth2.quran.foundation/oauth2/token';
const QF_API_BASE =
  process.env.EXPO_PUBLIC_OTTV_QF_API_BASE ?? 'https://apis.quran.foundation';
const QF_PUBLIC_API_BASE =
  process.env.EXPO_PUBLIC_OTTV_QF_PUBLIC_API_BASE ??
  'https://api.quran.com/api/v4';
const parsedRateLimit = Number.parseInt(
  process.env.EXPO_PUBLIC_OTTV_QF_RATE_LIMIT_MS ?? '',
  10,
);
const QF_RATE_LIMIT_MS = Number.isFinite(parsedRateLimit)
  ? parsedRateLimit
  : 1100;

const MP3QURAN_V4_ENABLED =
  process.env.EXPO_PUBLIC_OTTV_ENABLE_MP3QURAN_V4 === 'true';
const MP3QURAN_V4_BASE_URL =
  process.env.EXPO_PUBLIC_OTTV_MP3QURAN_V4_BASE_URL ??
  'https://api-staging.mp3quran.net/v4';

export function getItqanConfig(): ItqanConfig {
  return {
    baseUrl: ITQAN_BASE_URL,
    ...(ITQAN_API_KEY ? { apiKey: ITQAN_API_KEY } : {}),
  };
}

export function getQuranAiConfig(): QuranAiConfig {
  return { baseUrl: QURANAI_BASE_URL };
}

export function getQfConfig(): QfConfig {
  return {
    ...(QF_CLIENT_ID ? { clientId: QF_CLIENT_ID } : {}),
    ...(QF_CLIENT_SECRET ? { clientSecret: QF_CLIENT_SECRET } : {}),
    tokenUrl: QF_TOKEN_URL,
    apiBase: QF_API_BASE,
    publicApiBase: QF_PUBLIC_API_BASE,
    rateLimitMs: QF_RATE_LIMIT_MS,
  };
}

export function getMp3QuranV4Config(): Mp3QuranV4Config {
  return { enabled: MP3QURAN_V4_ENABLED, baseUrl: MP3QURAN_V4_BASE_URL };
}

// The settings screen iterates this list; a flag-disabled MP3Quran v4 has no
// toggle and is never registered as a reciter source.
export const ACTIVE_SOURCES: readonly LinkSource[] = [
  LinkSource.MP3QURAN,
  LinkSource.ITQAN,
  LinkSource.QURANAI,
  LinkSource.QURAN_FOUNDATION,
  ...(MP3QURAN_V4_ENABLED ? [LinkSource.MP3QURAN_V4] : []),
];
