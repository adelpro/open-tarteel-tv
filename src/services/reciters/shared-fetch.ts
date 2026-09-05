export const fetchWithTimeout = (
  url: string,
  timeoutMs = 10_000,
  extraHeaders: Record<string, string> = {},
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

    const timeoutId = setTimeout(() => {
      // Abort the underlying request so the connection/body is released, then
      // surface the timeout error.
      controller.abort();
      reject(new Error('Fetch timeout'));
    }, timeoutMs);

    const cleanup = () => {
      clearTimeout(timeoutId);
      externalSignal?.removeEventListener('abort', onExternalAbort);
    };

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
      // Exponential backoff with jitter, skipped after the final attempt.
      if (i < maxAttempts - 1) {
        const backoffMs = 2 ** i * 1000 + Math.random() * 1000;
        await new Promise((r) => setTimeout(r, backoffMs));
      }
    }
  }

  throw lastError!;
};
