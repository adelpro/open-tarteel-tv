import { fetchWithTimeout, retryFetch } from './shared-fetch';
import { getQfConfig, type QfConfig } from '../../config/providers';
import { encodeBase64 } from '../../utils/base64';

const TOKEN_MAX_ATTEMPTS = 3;
const REQUEST_MAX_ATTEMPTS = 3;
const TOKEN_EXPIRY_MARGIN_MS = 60_000;
const TOKEN_TIMEOUT_MS = 10_000;
const REQUEST_TIMEOUT_MS = 10_000;
const DEFAULT_TOKEN_EXPIRY_SECONDS = 3600;

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
const noop = (): Promise<void> => Promise.resolve();

/** Convert a RequestInit.headers value to a plain object (RN-safe, no Buffer). */
const toHeaderObject = (headers?: HeadersInit): Record<string, string> => {
  const result: Record<string, string> = {};
  if (!headers) return result;
  if (Array.isArray(headers)) {
    for (const [key, value] of headers) result[key] = value;
  } else if (typeof (headers as Headers).forEach === 'function') {
    (headers as Headers).forEach((value, key) => {
      result[key] = value;
    });
  } else {
    Object.assign(result, headers as Record<string, string>);
  }
  return result;
};

/**
 * POST the OAuth token request with the same abort/timeout pattern as the
 * shared fetch helper (which only supports GET). A hung token endpoint must
 * not stall the serialized catalog queue forever, and Home's AbortController
 * must be able to cancel it.
 */
const postTokenRequest = (
  url: string,
  headers: Record<string, string>,
  body: string,
  externalSignal?: AbortSignal,
): Promise<Response> =>
  new Promise<Response>((resolve, reject) => {
    const controller = new AbortController();
    const onExternalAbort = () => controller.abort();

    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort();
      } else {
        externalSignal.addEventListener('abort', onExternalAbort);
      }
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const cleanup = () => {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      externalSignal?.removeEventListener('abort', onExternalAbort);
    };

    timeoutId = setTimeout(() => {
      cleanup();
      // Abort the underlying request so the connection/body is released.
      controller.abort();
      reject(new Error('Token request timeout'));
    }, TOKEN_TIMEOUT_MS);

    fetch(url, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal,
    }).then(
      (res) => {
        cleanup();
        resolve(res);
      },
      (err) => {
        cleanup();
        reject(err);
      },
    );
  });

let cachedToken: { value: string; expiresAt: number } | null = null;

/** Test/debug helper: drop the cached access token so the next call re-auths. */
export const resetQuranFoundationClientCache = (): void => {
  cachedToken = null;
};

const fetchFreshToken = async (
  config: QfConfig,
  clientId: string,
  clientSecret: string,
  signal?: AbortSignal,
): Promise<{ access_token: string; expires_in?: number }> => {
  // Basic auth credentials must be base64 encoded; RN has no Node Buffer.
  const basicAuth = encodeBase64(`${clientId}:${clientSecret}`);
  const backoff = config.rateLimitMs > 0 ? delay : noop;
  let response: Response | null = null;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < TOKEN_MAX_ATTEMPTS; attempt++) {
    if (signal?.aborted) throw new Error('Aborted');
    try {
      const candidate = await postTokenRequest(
        config.tokenUrl,
        {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${basicAuth}`,
        },
        'grant_type=client_credentials&scope=content',
        signal,
      );
      if (!candidate.ok) throw new Error(`HTTP ${candidate.status}`);
      response = candidate;
      break;
    } catch (error) {
      // An abort is a cancelled load, not a retryable token error.
      if (signal?.aborted) throw error;
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < TOKEN_MAX_ATTEMPTS - 1) await backoff(2 ** attempt * 1000);
    }
  }

  if (!response) {
    throw new Error(
      `Failed to fetch quran.foundation access token (${lastError?.message ?? 'unknown'})`,
    );
  }

  const data = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };
  if (!data.access_token) {
    throw new Error('quran.foundation token response missing access_token');
  }
  return { access_token: data.access_token, expires_in: data.expires_in };
};

/**
 * Return a valid OAuth access token, fetching a fresh one when the cache is
 * empty, expired or a refresh is forced. The 60s safety margin is applied
 * exactly once: it is baked into `expiresAt` when the token is stored, so the
 * freshness check below compares against the real current time.
 */
export const getAccessToken = async (
  forceRefresh = false,
  signal?: AbortSignal,
): Promise<string> => {
  if (!forceRefresh && cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  const config = getQfConfig();
  const { clientId, clientSecret } = config;
  if (!clientId || !clientSecret) {
    throw new Error('quran.foundation credentials are not configured');
  }

  const data = await fetchFreshToken(config, clientId, clientSecret, signal);
  cachedToken = {
    value: data.access_token,
    expiresAt:
      Date.now() +
      (data.expires_in ?? DEFAULT_TOKEN_EXPIRY_SECONDS) * 1000 -
      TOKEN_EXPIRY_MARGIN_MS,
  };
  return data.access_token;
};

/**
 * Fetch a Quran Foundation API path. Without credentials it falls back to the
 * public api.quran.com endpoints by stripping the `/content/api/v4` prefix.
 * With credentials it attaches the OAuth token + client id, forces at most one
 * token refresh on a 401, and retries a bounded number of times with the
 * configured pacing. Any OAuth failure degrades to the public path rather
 * than silently failing the source.
 */
export async function qfFetch(
  path: string,
  options?: RequestInit,
): Promise<Response> {
  const config = getQfConfig();
  const signal = options?.signal ?? undefined;
  const callerHeaders = toHeaderObject(options?.headers);

  const publicFallback = (): Promise<Response> => {
    const publicPath = path.replace(/^\/content\/api\/v4/, '');
    return retryFetch(
      `${config.publicApiBase}${publicPath}`,
      REQUEST_MAX_ATTEMPTS,
      Object.keys(callerHeaders).length > 0 ? callerHeaders : undefined,
      signal,
    );
  };

  if (!config.clientId || !config.clientSecret) {
    return publicFallback();
  }

  const clientId = config.clientId;
  const url = path.startsWith('http') ? path : `${config.apiBase}${path}`;
  const intervalMs = config.rateLimitMs;
  const backoff = intervalMs > 0 ? delay : noop;

  let currentToken: string;
  try {
    currentToken = await getAccessToken(false, signal);
  } catch (error) {
    // A cancelled load must stay cancelled — never start a fallback request.
    if (signal?.aborted) throw error;
    return publicFallback();
  }

  let refreshUsed = false;
  let lastError: Error | null = null;
  let authFailure = false;

  for (let index = 0; index < REQUEST_MAX_ATTEMPTS; index++) {
    try {
      const headers = { ...callerHeaders };
      headers['x-auth-token'] = currentToken;
      headers['x-client-id'] = clientId;

      const response = await fetchWithTimeout(
        url,
        REQUEST_TIMEOUT_MS,
        headers,
        signal,
      );

      if (response.status === 401) {
        if (refreshUsed) {
          // Never refresh on every attempt: one refresh per qfFetch, then
          // degrade to the public endpoint.
          authFailure = true;
          throw new Error('HTTP 401 after token refresh');
        }
        refreshUsed = true;
        try {
          currentToken = await getAccessToken(true, signal);
        } catch (error) {
          if (signal?.aborted) throw error;
          authFailure = true;
          return publicFallback();
        }
        lastError = new Error('HTTP 401');
        // Keep the configured pacing on the 401 retry — the old `continue`
        // skipped it entirely.
        await backoff(intervalMs);
        continue;
      }

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (intervalMs > 0) await delay(intervalMs);
      return response;
    } catch (error) {
      if (signal?.aborted) throw error;
      lastError = error instanceof Error ? error : new Error(String(error));
      if (index < REQUEST_MAX_ATTEMPTS - 1) await backoff(2 ** index * 1000);
    }
  }

  if (authFailure) {
    return publicFallback();
  }
  throw lastError ?? new Error('quran.foundation request failed');
}
