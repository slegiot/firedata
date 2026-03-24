// ─── Scrape ─────────────────────────────────────────────────

export type ScrapeFormat = 'markdown' | 'html' | 'rawHtml' | 'links' | 'screenshot';

export interface ScrapeOptions {
  /** Output formats to request. @default ['markdown'] */
  formats?: ScrapeFormat[];
  /** CSS selector to wait for before scraping. */
  waitFor?: string;
  /** Request timeout in ms. @default 30000 */
  timeout?: number;
  /** Custom headers sent to the target URL. */
  headers?: Record<string, string>;
  /** Proxy URL override for this specific call. */
  proxy?: string;
}

export interface ScrapeResult {
  success: boolean;
  data: {
    url: string;
    markdown?: string;
    html?: string;
    rawHtml?: string;
    links?: string[];
    screenshot?: string;
    metadata: ScrapeMetadata;
  };
}

export interface ScrapeMetadata {
  title?: string;
  description?: string;
  language?: string;
  ogImage?: string;
  sourceURL: string;
  statusCode: number;
  [key: string]: unknown;
}

// ─── Crawl ──────────────────────────────────────────────────

export interface CrawlOptions {
  /** Maximum link depth to follow. @default 2 */
  maxDepth?: number;
  /** Max pages to crawl. @default 50 */
  limit?: number;
  /** Glob patterns for paths to include. */
  includePaths?: string[];
  /** Glob patterns for paths to exclude. */
  excludePaths?: string[];
  /** Output formats for each page. @default ['markdown'] */
  scrapeOptions?: {
    formats?: ScrapeFormat[];
  };
  /** Proxy URL override for this crawl job. */
  proxy?: string;
}

export interface CrawlResult {
  success: boolean;
  id: string;
  url: string;
}

export interface CrawlStatusResult {
  success: boolean;
  status: 'scraping' | 'completed' | 'failed';
  total: number;
  completed: number;
  data: CrawlPageData[];
}

export interface CrawlPageData {
  url: string;
  markdown?: string;
  html?: string;
  metadata: ScrapeMetadata;
}

// ─── Search ─────────────────────────────────────────────────

export interface SearchOptions {
  /** Max results to return. @default 5 */
  limit?: number;
  /** Language code. @default 'en' */
  lang?: string;
  /** Country code for localised results. */
  country?: string;
  /** Output formats. @default ['markdown'] */
  scrapeOptions?: {
    formats?: ScrapeFormat[];
  };
  /** Proxy URL override. */
  proxy?: string;
}

export interface SearchResult {
  success: boolean;
  data: SearchResultItem[];
}

export interface SearchResultItem {
  url: string;
  title: string;
  description: string;
  markdown?: string;
  html?: string;
  metadata: ScrapeMetadata;
}

// ─── Client config ──────────────────────────────────────────

export interface FirecrawlClientConfig {
  /** Firecrawl API base URL (no trailing slash). */
  baseUrl: string;
  /** Optional API key for authenticated instances. */
  apiKey?: string;
  /** Default proxy URL applied to all requests (overridable per call). */
  defaultProxy?: string;
  /** Max retry attempts on 5xx / network errors. @default 3 */
  maxRetries?: number;
  /** Base delay in ms for exponential backoff. @default 1000 */
  retryBaseDelayMs?: number;
  /** Request timeout in ms. @default 30000 */
  timeoutMs?: number;
}

// ─── Errors ─────────────────────────────────────────────────

export class FirecrawlError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly responseBody?: string,
  ) {
    super(message);
    this.name = 'FirecrawlError';
  }
}
