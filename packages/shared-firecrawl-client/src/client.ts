export interface ScrapeOptions {
  formats?: ('markdown' | 'html' | 'json')[];
  waitFor?: number;
  timeout?: number;
}

export interface ScrapeResult {
  url: string;
  markdown?: string;
  html?: string;
  metadata?: Record<string, unknown>;
}

export interface CrawlOptions {
  maxDepth?: number;
  limit?: number;
  includePaths?: string[];
  excludePaths?: string[];
}

const DEFAULT_TIMEOUT = 30_000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1_000;

export class FirecrawlClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string, apiKey?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
  }

  async scrape(url: string, options: ScrapeOptions = {}): Promise<ScrapeResult> {
    const body = {
      url,
      formats: options.formats ?? ['markdown'],
      waitFor: options.waitFor,
      timeout: options.timeout ?? DEFAULT_TIMEOUT,
    };

    const response = await this.fetchWithRetry('/v1/scrape', body);
    return response as ScrapeResult;
  }

  async crawl(url: string, options: CrawlOptions = {}): Promise<{ jobId: string }> {
    const body = {
      url,
      maxDepth: options.maxDepth ?? 2,
      limit: options.limit ?? 50,
      includePaths: options.includePaths,
      excludePaths: options.excludePaths,
    };

    const response = await this.fetchWithRetry('/v1/crawl', body);
    return response as { jobId: string };
  }

  private async fetchWithRetry(
    path: string,
    body: Record<string, unknown>,
    retries = MAX_RETRIES,
  ): Promise<unknown> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(`${this.baseUrl}${path}`, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(DEFAULT_TIMEOUT),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Firecrawl ${res.status}: ${text}`);
        }

        return await res.json();
      } catch (err) {
        if (attempt === retries) throw err;
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
      }
    }

    throw new Error('Firecrawl: max retries exceeded');
  }
}
