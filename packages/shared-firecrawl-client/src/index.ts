// ─── Client ─────────────────────────────────────────────────
export { FirecrawlClient } from './client.js';

// ─── Types ──────────────────────────────────────────────────
export type {
  FirecrawlClientConfig,
  ScrapeOptions,
  ScrapeResult,
  ScrapeMetadata,
  ScrapeFormat,
  CrawlOptions,
  CrawlResult,
  CrawlStatusResult,
  CrawlPageData,
  SearchOptions,
  SearchResult,
  SearchResultItem,
} from './types.js';

export { FirecrawlError } from './types.js';

// ─── Retry utilities (for advanced usage) ───────────────────
export { calculateBackoff, isRetryableError } from './retry.js';
