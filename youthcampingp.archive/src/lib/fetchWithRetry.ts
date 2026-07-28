/**
 * Fetch wrapper with exponential backoff retry for 5xx errors.
 * Returns response on 2xx/3xx/4xx (4xx is client error, no retry needed).
 * Retries up to `maxRetries` times for 5xx server errors or network drops.
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  maxRetries = 3,
  baseDelayMs = 500
): Promise<Response | null> {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const response = await fetch(url, options);

      // If status is 5xx, retry with exponential backoff
      if (response.status >= 500 && attempt < maxRetries - 1) {
        attempt++;
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        console.warn(
          `[fetchWithRetry] Received HTTP ${response.status} for ${url}. Retrying in ${delay}ms (Attempt ${attempt}/${maxRetries})...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      return response;
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) {
        console.error(`[fetchWithRetry] Network request failed permanently for ${url}:`, error);
        return null;
      }
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      console.warn(
        `[fetchWithRetry] Network error for ${url}. Retrying in ${delay}ms (Attempt ${attempt}/${maxRetries})...`
      );
      await new Promise((resolve) => setTimeout(resolve, resolveDelay(delay)));
    }
  }

  return null;
}

function resolveDelay(delay: number) {
  return delay;
}
