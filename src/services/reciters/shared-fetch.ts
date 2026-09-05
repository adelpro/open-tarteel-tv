export const fetchWithTimeout = (
  url: string,
  timeoutMs = 10_000,
  extraHeaders: Record<string, string> = {},
  signal?: AbortSignal,
): Promise<Response> =>
  new Promise<Response>((resolve, reject) => {
    const timeoutId = setTimeout(
      () => reject(new Error('Fetch timeout')),
      timeoutMs,
    );

    // Attach handlers so a late fetch resolution/rejection after timeout or
    // abort is always handled (no unhandled promise rejections).
    fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'OpenTarteelTV/1.0.0',
        'X-Requested-With': 'XMLHttpRequest',
        ...extraHeaders,
      },
      // Enhanced CORS configuration for React Native TV
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-cache',
      redirect: 'follow',
      signal,
    }).then(
      (res) => {
        clearTimeout(timeoutId);
        resolve(res);
      },
      (err) => {
        clearTimeout(timeoutId);
        reject(err);
      },
    );
  });

export const retryFetch = async (
  url: string,
  maxAttempts = 3,
  extraHeaders?: Record<string, string>,
  signal?: AbortSignal,
): Promise<Response> => {
  let lastError: Error | null = null;

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetchWithTimeout(url, 10_000, extraHeaders, signal);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (e) {
      // Abort is not a retryable failure — propagate immediately.
      if (signal?.aborted) throw e;
      lastError = e instanceof Error ? e : new Error(String(e));
      // Exponential backoff with jitter
      const backoffMs = 2 ** i * 1000 + Math.random() * 1000;
      await new Promise((r) => setTimeout(r, backoffMs));
    }
  }

  throw lastError!;
};
