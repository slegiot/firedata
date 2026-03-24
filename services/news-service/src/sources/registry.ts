/**
 * News source registry — dispatches fetch requests
 * to the correct fetcher based on source type.
 */
import type { FirecrawlClient } from '@firedata/shared-firecrawl-client';
import type { NewsSourceConfig, NewsSourceFetcher, RawArticle } from './types.js';
import { RssFetcher } from './rss-fetcher.js';
import { HtmlFetcher } from './html-fetcher.js';

export class NewsSourceRegistry {
  private fetchers: Map<string, NewsSourceFetcher> = new Map();

  constructor(firecrawl: FirecrawlClient) {
    this.fetchers.set('rss', new RssFetcher());
    this.fetchers.set('html', new HtmlFetcher(firecrawl));
  }

  /** Fetch articles from a single source. */
  async fetchSource(config: NewsSourceConfig): Promise<RawArticle[]> {
    const fetcher = this.fetchers.get(config.type);
    if (!fetcher) {
      console.error(`[registry] Unknown source type: ${config.type}`);
      return [];
    }
    return fetcher.fetch(config);
  }

  /** Fetch articles from all provided sources in parallel. */
  async fetchAll(configs: NewsSourceConfig[]): Promise<RawArticle[]> {
    const enabled = configs.filter((c) => c.enabled);

    const results = await Promise.allSettled(
      enabled.map((config) => this.fetchSource(config)),
    );

    const articles: RawArticle[] = [];
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'fulfilled') {
        articles.push(...result.value);
        console.log(`[registry] ${enabled[i].id}: ${result.value.length} articles`);
      } else {
        console.error(`[registry] ${enabled[i].id}: Failed:`, result.reason);
      }
    }

    return articles;
  }
}
