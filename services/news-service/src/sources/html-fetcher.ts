/**
 * HTML scraper fetcher using Firecrawl.
 *
 * Scrapes a web page via Firecrawl, extracts headline articles
 * from the resulting markdown by finding links with surrounding text.
 */
import type { FirecrawlClient } from '@firedata/shared-firecrawl-client';
import type { NewsSourceConfig, NewsSourceFetcher, RawArticle } from './types.js';

export class HtmlFetcher implements NewsSourceFetcher {
  constructor(private readonly firecrawl: FirecrawlClient) {}

  async fetch(config: NewsSourceConfig): Promise<RawArticle[]> {
    try {
      const result = await this.firecrawl.scrape(config.url, {
        formats: ['markdown'],
        timeout: 20_000,
      });

      if (!result.success || !result.data.markdown) {
        console.error(`[html] ${config.id}: Scrape failed`);
        return [];
      }

      return this.parseMarkdown(result.data.markdown, config);
    } catch (err) {
      console.error(`[html] ${config.id}: Error:`, err);
      return [];
    }
  }

  /** Parse markdown from a scraped page into article entries. Exported for testing. */
  parseMarkdown(markdown: string, config: NewsSourceConfig): RawArticle[] {
    const articles: RawArticle[] = [];

    // Extract markdown links: [Title](URL)
    const linkPattern = /\[([^\]]{10,200})\]\((https?:\/\/[^\s)]+)\)/g;
    let match: RegExpExecArray | null;
    const seenUrls = new Set<string>();

    while ((match = linkPattern.exec(markdown)) !== null) {
      const [, title, url] = match;

      // Skip navigation, social, image links, and short titles
      if (this.isNavigationLink(title, url)) continue;
      if (seenUrls.has(url)) continue;
      seenUrls.add(url);

      // Extract surrounding text as summary (up to 300 chars after the link)
      const afterLink = markdown.slice(match.index + match[0].length, match.index + match[0].length + 500);
      const summary = this.extractSummary(afterLink);

      articles.push({
        sourceId: config.id,
        sourceName: config.name,
        url,
        title: title.trim(),
        summary,
        body: null,
        language: null,
        categoryHint: config.category,
        publishedAt: null, // HTML scrapes don't reliably give dates
        raw: { scrapedFrom: config.url, markdownSnippet: markdown.slice(match.index, match.index + 500) },
      });
    }

    // Also extract headings that might be headline patterns: ## Headline
    const headingPattern = /^#{1,3}\s+([^\n]{10,200})/gm;
    while ((match = headingPattern.exec(markdown)) !== null) {
      const title = match[1].trim();
      // Only add if we haven't seen a link with the same title
      const duplicate = articles.some(
        (a) => a.title.toLowerCase() === title.toLowerCase(),
      );
      if (!duplicate && !this.isNavigationLink(title, '')) {
        // Try to find a link near this heading
        const nearbyText = markdown.slice(match.index, match.index + 1000);
        const nearbyLink = nearbyText.match(/\((https?:\/\/[^\s)]+)\)/);

        if (nearbyLink) {
          const url = nearbyLink[1];
          if (!seenUrls.has(url)) {
            seenUrls.add(url);
            articles.push({
              sourceId: config.id,
              sourceName: config.name,
              url,
              title,
              summary: this.extractSummary(nearbyText.slice(match[0].length)),
              body: null,
              language: null,
              categoryHint: config.category,
              publishedAt: null,
              raw: { scrapedFrom: config.url },
            });
          }
        }
      }
    }

    return articles;
  }

  private isNavigationLink(title: string, url: string): boolean {
    const navWords = [
      'home', 'about', 'contact', 'sign in', 'log in', 'subscribe',
      'menu', 'search', 'privacy', 'terms', 'cookie', 'newsletter',
      'follow', 'share', 'tweet', 'facebook', 'instagram',
    ];
    const lower = title.toLowerCase();
    if (navWords.some((w) => lower === w || lower.startsWith(w + ' '))) return true;
    if (title.length < 15 && !title.includes(' ')) return true; // Single-word short titles
    if (url.includes('twitter.com') || url.includes('facebook.com')) return true;
    return false;
  }

  private extractSummary(text: string): string | null {
    // Take the first sentence or paragraph of text after a link
    const cleaned = text
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // Remove markdown links
      .replace(/[#*_`]/g, '') // Remove markdown formatting
      .trim();

    if (!cleaned || cleaned.length < 20) return null;

    const firstSentence = cleaned.match(/^[^.!?]{20,300}[.!?]/);
    return firstSentence ? firstSentence[0].trim() : cleaned.slice(0, 300).trim();
  }
}
