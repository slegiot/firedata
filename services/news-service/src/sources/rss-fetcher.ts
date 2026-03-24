/**
 * RSS / Atom feed fetcher.
 *
 * Uses native `fetch()` to download feed XML and `fast-xml-parser`
 * to parse it. Handles both RSS 2.0 (<item>) and Atom (<entry>) formats.
 */
import { XMLParser } from 'fast-xml-parser';
import type { NewsSourceConfig, NewsSourceFetcher, RawArticle } from './types.js';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  trimValues: true,
});

export class RssFetcher implements NewsSourceFetcher {
  async fetch(config: NewsSourceConfig): Promise<RawArticle[]> {
    const res = await fetch(config.url, {
      headers: { 'User-Agent': 'FireData/1.0 (news-aggregator)' },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      console.error(`[rss] ${config.id}: HTTP ${res.status}`);
      return [];
    }

    const xml = await res.text();
    return this.parse(xml, config);
  }

  /** Parse RSS/Atom XML into RawArticle[]. Exported for testing. */
  parse(xml: string, config: NewsSourceConfig): RawArticle[] {
    try {
      const parsed = parser.parse(xml);

      // RSS 2.0: rss.channel.item
      const rssItems = parsed?.rss?.channel?.item;
      if (rssItems) {
        return this.normalizeItems(
          Array.isArray(rssItems) ? rssItems : [rssItems],
          config,
          'rss',
        );
      }

      // Atom: feed.entry
      const atomEntries = parsed?.feed?.entry;
      if (atomEntries) {
        return this.normalizeItems(
          Array.isArray(atomEntries) ? atomEntries : [atomEntries],
          config,
          'atom',
        );
      }

      console.warn(`[rss] ${config.id}: No items found in feed`);
      return [];
    } catch (err) {
      console.error(`[rss] ${config.id}: Parse error:`, err);
      return [];
    }
  }

  private normalizeItems(
    items: any[],
    config: NewsSourceConfig,
    format: 'rss' | 'atom',
  ): RawArticle[] {
    return items
      .map((item) => this.normalizeItem(item, config, format))
      .filter((a): a is RawArticle => a !== null);
  }

  private normalizeItem(
    item: any,
    config: NewsSourceConfig,
    format: 'rss' | 'atom',
  ): RawArticle | null {
    const title = item.title
      ? (typeof item.title === 'object' ? item.title['#text'] : String(item.title))
      : null;

    if (!title) return null;

    let url: string | null = null;
    if (format === 'rss') {
      url = item.link ? String(item.link) : null;
    } else {
      // Atom links can be objects with @_href
      url = item.link?.['@_href'] ?? (typeof item.link === 'string' ? item.link : null);
    }

    if (!url) return null;

    const summary = item.description
      ?? item.summary
      ?? item['media:description']
      ?? null;

    const pubDateStr = item.pubDate ?? item.published ?? item.updated ?? null;
    const publishedAt = pubDateStr ? new Date(pubDateStr) : null;

    return {
      sourceId: config.id,
      sourceName: config.name,
      url,
      title: this.stripHtml(String(title)),
      summary: summary ? this.stripHtml(String(summary)).slice(0, 1000) : null,
      body: null, // RSS feeds only give summaries
      language: null,
      categoryHint: config.category,
      publishedAt:
        publishedAt && !isNaN(publishedAt.getTime()) ? publishedAt : null,
      raw: item,
    };
  }

  /** Strip basic HTML tags from text. */
  private stripHtml(text: string): string {
    return text
      .replace(/<[^>]*>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }
}
