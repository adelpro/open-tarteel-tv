import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LinkSource } from '../types';

const OTTV_ENV_KEYS = [
  'EXPO_PUBLIC_OTTV_ITQAN_BASE_URL',
  'EXPO_PUBLIC_OTTV_ITQAN_API_KEY',
  'EXPO_PUBLIC_OTTV_QURANAI_BASE_URL',
  'EXPO_PUBLIC_OTTV_QF_CLIENT_ID',
  'EXPO_PUBLIC_OTTV_QF_CLIENT_SECRET',
  'EXPO_PUBLIC_OTTV_QF_TOKEN_URL',
  'EXPO_PUBLIC_OTTV_QF_API_BASE',
  'EXPO_PUBLIC_OTTV_QF_PUBLIC_API_BASE',
  'EXPO_PUBLIC_OTTV_QF_RATE_LIMIT_MS',
  'EXPO_PUBLIC_OTTV_ENABLE_MP3QURAN_V4',
  'EXPO_PUBLIC_OTTV_MP3QURAN_V4_BASE_URL',
] as const;

describe('provider config', () => {
  beforeEach(() => {
    vi.resetModules();
    // Start every test from a clean slate so defaults are observable even
    // when a local .env.local happens to be loaded by Vitest.
    for (const key of OTTV_ENV_KEYS) {
      vi.stubEnv(key, undefined);
    }
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses the documented defaults when no OTTV variables are set', async () => {
    const {
      getItqanConfig,
      getQuranAiConfig,
      getQfConfig,
      getMp3QuranV4Config,
    } = await import('./providers');

    expect(getItqanConfig().baseUrl).toBe('https://api.cms.itqan.dev');
    expect(getQuranAiConfig().baseUrl).toBe('https://api.qurani.ai/gw/qh/v1');

    const qf = getQfConfig();
    expect(qf.tokenUrl).toBe('https://oauth2.quran.foundation/oauth2/token');
    expect(qf.apiBase).toBe('https://apis.quran.foundation');
    expect(qf.publicApiBase).toBe('https://api.quran.com/api/v4');
    expect(qf.rateLimitMs).toBe(1100);

    const v4 = getMp3QuranV4Config();
    expect(v4.enabled).toBe(false);
    expect(v4.baseUrl).toBe('https://api-staging.mp3quran.net/v4');
  });

  it('enables MP3Quran v4 and lists it as active when the flag is true', async () => {
    vi.stubEnv('EXPO_PUBLIC_OTTV_ENABLE_MP3QURAN_V4', 'true');

    const { getMp3QuranV4Config, ACTIVE_SOURCES } = await import('./providers');

    expect(getMp3QuranV4Config().enabled).toBe(true);
    expect(ACTIVE_SOURCES).toContain(LinkSource.MP3QURAN_V4);
  });

  it('exposes the four default sources and hides v4 by default', async () => {
    const { ACTIVE_SOURCES } = await import('./providers');

    expect(ACTIVE_SOURCES).toEqual([
      LinkSource.MP3QURAN,
      LinkSource.ITQAN,
      LinkSource.QURANAI,
      LinkSource.QURAN_FOUNDATION,
    ]);
    expect(ACTIVE_SOURCES).not.toContain(LinkSource.MP3QURAN_V4);
  });

  it('reads OTTV overrides once at module load', async () => {
    vi.stubEnv('EXPO_PUBLIC_OTTV_ITQAN_BASE_URL', 'https://itqan.example');
    vi.stubEnv('EXPO_PUBLIC_OTTV_QURANAI_BASE_URL', 'https://qurani.example');
    vi.stubEnv('EXPO_PUBLIC_OTTV_QF_RATE_LIMIT_MS', '2500');
    vi.stubEnv('EXPO_PUBLIC_OTTV_MP3QURAN_V4_BASE_URL', 'https://v4.example');

    const {
      getItqanConfig,
      getQuranAiConfig,
      getQfConfig,
      getMp3QuranV4Config,
    } = await import('./providers');

    expect(getItqanConfig().baseUrl).toBe('https://itqan.example');
    expect(getQuranAiConfig().baseUrl).toBe('https://qurani.example');
    expect(getQfConfig().rateLimitMs).toBe(2500);
    expect(getMp3QuranV4Config().baseUrl).toBe('https://v4.example');
  });

  it('encodes ASCII Basic auth credentials without Node APIs', async () => {
    const { encodeBase64 } = await import('../utils/base64');

    expect(encodeBase64('client:secret')).toBe('Y2xpZW50OnNlY3JldA==');
  });
});
