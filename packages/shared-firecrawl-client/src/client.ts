import type {
  FirecrawlClientConfig,
  ScrapeOptions,
  ScrapeResult,
  CrawlOptions,
  CrawlResult,
  CrawlStatusResult,
  SearchOptions,
  SearchResult,
} from './types.js';
import { FirecrawlError } from './types.js';
import { calculateBackoff, isRetryableError, sleep } from './retry.js';

const DEFAULTS = {
  maxRetries: 3,
  retryBaseDelayMs: 1_000,
  timeoutMs: 30_000,
} as const;

export class FirecrawlClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly defaultProxy?: string;
  private readonly maxRetries: number;
  private readonly retryBaseDelayMs: number;
  private readonly timeoutMs: number;

  constructor(config: FirecrawlClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.defaultProxy = config.defaultProxy;
    this.maxRetries = config.maxRetries ?? DEFAULTS.maxRetries;
    this.retryBaseDelayMs = config.retryBaseDelayMs ?? DEFAULTS.retryBaseDelayMs;
    this.timeoutMs = config.timeoutMs ?? DEFAULTS.timeoutMs;
  }

  /**
   * Create a client from environment variables.
   *
   * Reads:
   *   FIRECRAWL_BASE_URL (required)
   *   FIRECRAWL_API_KEY  (optional)
   *   FIRECRAWL_PROXY    (optional default proxy)
   */
  static fromEnv(): FirecrawlClient {
    const baseUrl = process.env.FIRECRAWL_BASE_URL;
    if (!baseUrl) {
      throw new Error('FIRECRAWL_BASE_URL environment variable is required');
    }
    return new FirecrawlClient({
      baseUrl,
      apiKey: process.env.FIRECRAWL_API_KEY,
      defaultProxy: process.env.FIRECRAWL_PROXY,
    });
  }

  // ── Scrape ──────────────────────────────────────────────────

  /**
   * Scrape a single page and return structured content.
   */
  async scrape(url: string, options: ScrapeOptions = {}): Promise<ScrapeResult> {
    const body: Record<string, unknown> = {
      url,
      formats: options.formats ?? ['markdown'],
    };

    if (options.waitFor) body.waitFor = options.waitFor;
    if (options.timeout) body.timeout = options.timeout;
    if (options.headers) body.headers = options.headers;

    const proxy = options.proxy ?? this.defaultProxy;

    return this.request<ScrapeResult>('POST', '/v1/scrape', body, proxy);
  }

  // ── Crawl ───────────────────────────────────────────────────

  /**
   * Start an async crawl job. Returns a job ID to poll for status.
   */
  async crawl(url: string, options: CrawlOptions = {}): Promise<CrawlResult> {
    const body: Record<string, unknown> = {
      url,
      maxDepth: options.maxDepth ?? 2,
      limit: options.limit ?? 50,
    };

    if (options.includePaths) body.includePaths = options.includePaths;
    if (options.excludePaths) body.excludePaths = options.excludePaths;
    if (options.scrapeOptions) body.scrapeOptions = options.scrapeOptions;

    const proxy = options.proxy ?? this.defaultProxy;

    return this.request<CrawlResult>('POST', '/v1/crawl', body, proxy);
  }

  /**
   * Check the status of a crawl job.
   */
  async getCrawlStatus(jobId: string): Promise<CrawlStatusResult> {
    return this.request<CrawlStatusResult>('GET', `/v1/crawl/${jobId}`);
  }

  /**
   * Start a crawl and poll until completion.
   * Convenience wrapper around crawl() + getCrawlStatus().
   *
   * @param pollIntervalMs - How often to check status. @default 2000
   * @param maxWaitMs      - Timeout for the entire operation. @default 120000
   */
  async crawlAndWait(
    url: string,
    options: CrawlOptions = {},
    pollIntervalMs = 2_000,
    maxWaitMs = 120_000,
  ): Promise<CrawlStatusResult> {
    const { id } = await this.crawl(url, options);
    const deadline = Date.now() + maxWaitMs;

    while (Date.now() < deadline) {
      const status = await this.getCrawlStatus(id);
      if (status.status === 'completed' || status.status === 'failed') {
        return status;
      }
      await sleep(pollIntervalMs);
    }

    throw new FirecrawlError(`Crawl ${id} timed out after ${maxWaitMs}ms`);
  }

  // ── Search ──────────────────────────────────────────────────

  /**
   * Search the web and return scraped results.
   */
  async search(query: string, options: SearchOptions = {}): Promise<SearchResult> {
    const body: Record<string, unknown> = {
      query,
      limit: options.limit ?? 5,
    };

    if (options.lang) body.lang = options.lang;
    if (options.country) body.country = options.country;
    if (options.scrapeOptions) body.scrapeOptions = options.scrapeOptions;

    const proxy = options.proxy ?? this.defaultProxy;

    return this.request<SearchResult>('POST', '/v1/search', body, proxy);
  }

  // ── Internal ────────────────────────────────────────────────

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: Record<string, unknown>,
    proxy?: string,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;
    if (proxy) headers['X-Proxy-URL'] = proxy;

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const fetchOptions: RequestInit = {
          method,
          headers,
          signal: AbortSignal.timeout(this.timeoutMs),
        };

        if (body && method === 'POST') {
          fetchOptions.body = JSON.stringify(body);
        }

        const res = await fetch(url, fetchOptions);

        if (!res.ok) {
          const text = await res.text();
          throw new FirecrawlError(
            `Firecrawl API ${res.status} on ${method} ${path}: ${text.slice(0, 200)}`,
            res.status,
            text,
          );
        }

        return (await res.json()) as T;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        if (attempt < this.maxRetries && isRetryableError(err)) {
          const delay = calculateBackoff(attempt, this.retryBaseDelayMs);
          await sleep(delay);
          continue;
        }

        throw lastError;
      }
    }

    // Unreachable, but satisfies TypeScript
    throw lastError ?? new FirecrawlError('Max retries exceeded');
  }
}
