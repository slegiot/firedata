/**
 * Internal service proxy client.
 *
 * Routes requests to backend services via HTTP fetch.
 * Uses env vars for service discovery.
 */

export interface ServiceConfig {
  finance: string;
  news: string;
  sports: string;
  odds: string;
}

export function getServiceUrls(): ServiceConfig {
  return {
    finance: process.env.FINANCE_SERVICE_URL || 'http://localhost:3001',
    news: process.env.NEWS_SERVICE_URL || 'http://localhost:3003',
    sports: process.env.SPORTS_SERVICE_URL || 'http://localhost:3002',
    odds: process.env.BETTING_ODDS_SERVICE_URL || 'http://localhost:3004',
  };
}

export interface ProxyResponse {
  status: number;
  data: unknown;
  cached: boolean;
}

/**
 * Proxy a GET request to an internal service.
 */
export async function proxyGet(
  baseUrl: string,
  path: string,
  query?: Record<string, string | undefined>,
): Promise<ProxyResponse> {
  const url = new URL(path, baseUrl);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, value);
      }
    }
  }

  const start = Date.now();

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(15_000),
    });

    const data = await response.json();
    const elapsed = Date.now() - start;

    if (elapsed > 5000) {
      console.warn(`[proxy] Slow response from ${url}: ${elapsed}ms`);
    }

    return {
      status: response.status,
      data,
      cached: false,
    };
  } catch (err) {
    console.error(`[proxy] Error fetching ${url}:`, err);
    return {
      status: 502,
      data: { error: 'Bad Gateway', message: `Upstream service unavailable: ${baseUrl}` },
      cached: false,
    };
  }
}
