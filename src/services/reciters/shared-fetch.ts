export const fetchWithTimeout = (
  url: string,
  timeoutMs = 10_000
): Promise<Response> =>
  Promise.race([
    fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'OpenTarteelTV/1.0.0',
        'X-Requested-With': 'XMLHttpRequest',
      },
      // Enhanced CORS configuration for React Native TV
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-cache',
      redirect: 'follow',
    }),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error("Fetch timeout")), timeoutMs)
    ),
  ]);

export const retryFetch = async (
  url: string,
  maxAttempts = 3
): Promise<Response> => {
  let lastError: Error | null = null;

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetchWithTimeout(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      // Exponential backoff with jitter
      const backoffMs = 2 ** i * 1000 + Math.random() * 1000;
      await new Promise((r) => setTimeout(r, backoffMs));
    }
  }

  throw lastError!;
};