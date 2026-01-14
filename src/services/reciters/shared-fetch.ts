export const fetchWithTimeout = (
  url: string,
  timeoutMs = 10_000
): Promise<Response> =>
  Promise.race([
    fetch(url),
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
      await new Promise((r) => setTimeout(r, 2 ** i * 1000));
    }
  }

  throw lastError!;
};
