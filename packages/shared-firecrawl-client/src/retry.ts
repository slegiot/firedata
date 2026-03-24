/**
 * Exponential backoff with jitter for retry logic.
 *
 * Delay = min(baseDelay * 2^attempt + jitter, maxDelay)
 *
 * Jitter prevents thundering-herd when multiple workers
 * retry against the same upstream simultaneously.
 */

const MAX_DELAY_MS = 30_000;

export function calculateBackoff(attempt: number, baseDelayMs: number): number {
  const exponential = baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * baseDelayMs * 0.5;
  return Math.min(exponential + jitter, MAX_DELAY_MS);
}

export function isRetryableError(err: unknown): boolean {
  // Network errors (fetch failures, DNS, timeouts)
  if (err instanceof TypeError) return true;
  if (err instanceof DOMException && err.name === 'AbortError') return true;

  // HTTP 5xx errors encoded in our FirecrawlError
  if (err instanceof Error && 'statusCode' in err) {
    const code = (err as { statusCode?: number }).statusCode;
    return code !== undefined && code >= 500;
  }

  return false;
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
