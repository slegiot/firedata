/**
 * News source types and interfaces.
 */

/** Configuration for a single news source. */
export interface NewsSourceConfig {
  /** Unique identifier for this source. */
  id: string;
  /** Human-readable name. */
  name: string;
  /** Fetcher type: RSS feed or HTML scraping via Firecrawl. */
  type: 'rss' | 'html';
  /** URL to fetch (RSS feed URL or page URL). */
  url: string;
  /** Default category hint for articles from this source. */
  category: string;
  /** How often to poll this source, in ms. */
  updateFrequencyMs: number;
  /** Whether this source is actively polled. */
  enabled: boolean;
}

/** A raw article parsed from a source before DB insertion. */
export interface RawArticle {
  /** Source config ID. */
  sourceId: string;
  /** Source name for DB `source` column. */
  sourceName: string;
  /** Article URL (used for dedup). */
  url: string;
  /** Article title. */
  title: string;
  /** Short summary / description. */
  summary: string | null;
  /** Full body text (markdown or plain text). */
  body: string | null;
  /** ISO language code if detectable. */
  language: string | null;
  /** Category hint from the source config. */
  categoryHint: string;
  /** Publication date. */
  publishedAt: Date | null;
  /** Raw data for audit trail. */
  raw: Record<string, unknown>;
}

/** Interface that all fetcher implementations must satisfy. */
export interface NewsSourceFetcher {
  /** Fetch articles from a configured source. */
  fetch(config: NewsSourceConfig): Promise<RawArticle[]>;
}
