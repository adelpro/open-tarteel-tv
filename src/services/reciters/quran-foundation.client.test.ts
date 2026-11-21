import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { QfConfig } from '../../config/providers';

const mocks = vi.hoisted(() => ({
  getQfConfig: vi.fn(),
  encodeBase64: vi.fn(),
  retryFetch: vi.fn(),
  fetchWithTimeout: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock('../../config/providers', () => ({ getQfConfig: mocks.getQfConfig }));

// Assert the Basic header is derived from encodeBase64 by giving it a sentinel.
vi.mock('../../utils/base64', () => ({ encodeBase64: mocks.encodeBase64 }));

vi.mock('./shared-fetch', () => ({
  retryFetch: mocks.retryFetch,
  fetchWithTimeout: mocks.fetchWithTimeout,
}));

import {
  getAccessToken,
  qfFetch,
  resetQuranFoundationClientCache,
} from './quran-foundation.client';

const BASE_CONFIG: QfConfig = {
  tokenUrl: 'https://oauth.example/token',
  apiBase: 'https://apis.example',
  publicApiBase: 'https://api.quran.com/api/v4',
  rateLimitMs: 0,
};

const CREDENTIALS: QfConfig = {
  ...BASE_CONFIG,
  clientId: 'tv-client-id',
  clientSecret: 'tv-client-secret',
};

const jsonResponse = (body: unknown, status = 200): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as Response;

const headersOf = (callIndex: number): Record<string, string> =>
  mocks.fetchWithTimeout.mock.calls[callIndex][2] as Record<string, string>;

describe('quran-foundation client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getQfConfig.mockReturnValue({ ...BASE_CONFIG });
    mocks.encodeBase64.mockReturnValue('BASE64_SENTINEL');
    vi.stubGlobal('fetch', mocks.fetch);
    resetQuranFoundationClientCache();
  });

  it('uses the public api.quran.com path with no auth headers when unconfigured', async () => {
    const response = jsonResponse({ ok: true });
    mocks.retryFetch.mockResolvedValue(response);

    const result = await qfFetch(
      '/content/api/v4/resources/chapter_reciters?language=ar',
    );

    expect(result).toBe(response);
    expect(mocks.retryFetch).toHaveBeenCalledTimes(1);
    const [url, attempts, headers] = mocks.retryFetch.mock.calls[0];
    expect(url).toBe(
      'https://api.quran.com/api/v4/resources/chapter_reciters?language=ar',
    );
    expect(attempts).toBe(3);
    expect(headers).toBeUndefined();
    expect(mocks.fetchWithTimeout).not.toHaveBeenCalled();
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it('builds the Basic header via encodeBase64 and caches the token across calls', async () => {
    mocks.getQfConfig.mockReturnValue({ ...CREDENTIALS });
    mocks.fetch.mockResolvedValue(
      jsonResponse({ access_token: 'tok-1', expires_in: 3600 }),
    );
    mocks.fetchWithTimeout.mockResolvedValue(jsonResponse({ ok: true }));

    await qfFetch('/content/api/v4/resources/chapter_reciters?language=en');
    await qfFetch('/content/api/v4/chapter_recitations/42');

    expect(mocks.encodeBase64).toHaveBeenCalledWith(
      'tv-client-id:tv-client-secret',
    );
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
    const [tokenUrl, init] = mocks.fetch.mock.calls[0];
    expect(tokenUrl).toBe('https://oauth.example/token');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({
      Authorization: 'Basic BASE64_SENTINEL',
      'Content-Type': 'application/x-www-form-urlencoded',
    });
    expect(init.body).toBe('grant_type=client_credentials&scope=content');

    expect(mocks.fetchWithTimeout).toHaveBeenCalledTimes(2);
    expect(mocks.fetchWithTimeout.mock.calls[0][0]).toBe(
      'https://apis.example/content/api/v4/resources/chapter_reciters?language=en',
    );
    expect(mocks.fetchWithTimeout.mock.calls[1][0]).toBe(
      'https://apis.example/content/api/v4/chapter_recitations/42',
    );
    expect(headersOf(0)).toMatchObject({
      'x-auth-token': 'tok-1',
      'x-client-id': 'tv-client-id',
    });
    expect(headersOf(1)).toMatchObject({
      'x-auth-token': 'tok-1',
      'x-client-id': 'tv-client-id',
    });
  });

  it('refreshes the token once and retries once on a 401', async () => {
    mocks.getQfConfig.mockReturnValue({ ...CREDENTIALS });
    mocks.fetch
      .mockResolvedValueOnce(
        jsonResponse({ access_token: 'tok-1', expires_in: 3600 }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ access_token: 'tok-2', expires_in: 3600 }),
      );
    mocks.fetchWithTimeout
      .mockResolvedValueOnce(jsonResponse({ message: 'expired' }, 401))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    const result = await qfFetch('/content/api/v4/chapter_recitations/42');

    expect(result.ok).toBe(true);
    expect(mocks.fetchWithTimeout).toHaveBeenCalledTimes(2);
    expect(headersOf(0)['x-auth-token']).toBe('tok-1');
    expect(headersOf(1)['x-auth-token']).toBe('tok-2');
    // Initial token fetch + exactly one forced refresh.
    expect(mocks.fetch).toHaveBeenCalledTimes(2);
  });

  it('resetQuranFoundationClientCache forces the next call to fetch a fresh token', async () => {
    mocks.getQfConfig.mockReturnValue({ ...CREDENTIALS });
    mocks.fetch
      .mockResolvedValueOnce(
        jsonResponse({ access_token: 'tok-1', expires_in: 3600 }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ access_token: 'tok-2', expires_in: 3600 }),
      );
    mocks.fetchWithTimeout.mockResolvedValue(jsonResponse({ ok: true }));

    await qfFetch('/content/api/v4/chapter_recitations/1');
    resetQuranFoundationClientCache();
    await qfFetch('/content/api/v4/chapter_recitations/1');

    expect(mocks.fetch).toHaveBeenCalledTimes(2);
    expect(headersOf(0)['x-auth-token']).toBe('tok-1');
    expect(headersOf(1)['x-auth-token']).toBe('tok-2');
  });

  it('getAccessToken reuses the cached value unless forceRefresh is set', async () => {
    mocks.getQfConfig.mockReturnValue({ ...CREDENTIALS });
    mocks.fetch
      .mockResolvedValueOnce(
        jsonResponse({ access_token: 'tok-1', expires_in: 3600 }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ access_token: 'tok-2', expires_in: 3600 }),
      );

    expect(await getAccessToken()).toBe('tok-1');
    expect(await getAccessToken()).toBe('tok-1');
    expect(await getAccessToken(true)).toBe('tok-2');
    expect(mocks.fetch).toHaveBeenCalledTimes(2);
  });
});
