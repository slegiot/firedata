import { describe, it, expect, vi } from 'vitest';
import { HtmlFetcher } from '../src/sources/html-fetcher.js';
import type { NewsSourceConfig } from '../src/sources/types.js';

const HTML_CONFIG: NewsSourceConfig = {
  id: 'test-html',
  name: 'Test HTML',
  type: 'html',
  url: 'https://www.example.com/news',
  category: 'finance',
  updateFrequencyMs: 300_000,
  enabled: true,
};

// ── Sample markdown from Firecrawl ─────────────────────────────

const SAMPLE_MARKDOWN = `
# Bloomberg Markets

Welcome to the markets page.

## Top Stories

[Tech Giants Rally as AI Earnings Beat Expectations](https://www.bloomberg.com/news/articles/2026-03-24/tech-rally)

The technology sector surged 3.2% on Monday as major companies reported better-than-expected AI revenue growth.

[Oil Prices Drop Amid OPEC Production Debate](https://www.bloomberg.com/news/articles/2026-03-24/oil-prices)

Crude oil fell to $72 per barrel as OPEC members disagreed on output cuts.

[Federal Reserve Signals Potential Rate Changes](https://www.bloomberg.com/news/articles/2026-03-24/fed-rates)

Chair Jerome Powell suggested the central bank may adjust its policy stance.

[Home](https://www.bloomberg.com/) | [About](https://www.bloomberg.com/about) | [Subscribe](https://www.bloomberg.com/subscribe)

[Follow us on Twitter](https://twitter.com/bloomberg)
`;

function mockFirecrawl(markdown: string, success = true) {
  return {
    scrape: vi.fn().mockResolvedValue({
      success,
      data: {
        url: 'https://www.bloomberg.com/markets',
        markdown: success ? markdown : '',
        metadata: {},
      },
    }),
  } as any;
}

// ── Tests ──────────────────────────────────────────────────────

describe('HtmlFetcher', () => {
  describe('parseMarkdown', () => {
    it('extracts articles from markdown links', () => {
      const firecrawl = mockFirecrawl(SAMPLE_MARKDOWN);
      const fetcher = new HtmlFetcher(firecrawl);
      const articles = fetcher.parseMarkdown(SAMPLE_MARKDOWN, HTML_CONFIG);

      expect(articles.length).toBeGreaterThanOrEqual(3);

      const techArticle = articles.find((a) => a.title.includes('Tech Giants'));
      expect(techArticle).toBeDefined();
      expect(techArticle!.url).toBe('https://www.bloomberg.com/news/articles/2026-03-24/tech-rally');
      expect(techArticle!.sourceName).toBe('Test HTML');
    });

    it('filters out navigation links', () => {
      const firecrawl = mockFirecrawl(SAMPLE_MARKDOWN);
      const fetcher = new HtmlFetcher(firecrawl);
      const articles = fetcher.parseMarkdown(SAMPLE_MARKDOWN, HTML_CONFIG);

      const navTitles = articles.map((a) => a.title.toLowerCase());
      expect(navTitles).not.toContain('home');
      expect(navTitles).not.toContain('about');
      expect(navTitles).not.toContain('subscribe');
    });

    it('filters out social media links', () => {
      const firecrawl = mockFirecrawl(SAMPLE_MARKDOWN);
      const fetcher = new HtmlFetcher(firecrawl);
      const articles = fetcher.parseMarkdown(SAMPLE_MARKDOWN, HTML_CONFIG);

      const urls = articles.map((a) => a.url);
      expect(urls.every((u) => !u.includes('twitter.com'))).toBe(true);
    });

    it('extracts summaries from surrounding text', () => {
      const firecrawl = mockFirecrawl(SAMPLE_MARKDOWN);
      const fetcher = new HtmlFetcher(firecrawl);
      const articles = fetcher.parseMarkdown(SAMPLE_MARKDOWN, HTML_CONFIG);

      const oilArticle = articles.find((a) => a.title.includes('Oil Prices'));
      expect(oilArticle?.summary).toBeTruthy();
    });

    it('deduplicates URLs within the same page', () => {
      const dupeMarkdown = `
[Same Article](https://example.com/article/1)
Some text.
[Same Article Again](https://example.com/article/1)
More text.
[Different Article Title](https://example.com/article/1)
`;
      const firecrawl = mockFirecrawl(dupeMarkdown);
      const fetcher = new HtmlFetcher(firecrawl);
      const articles = fetcher.parseMarkdown(dupeMarkdown, HTML_CONFIG);

      const urls = articles.map((a) => a.url);
      const uniqueUrls = [...new Set(urls)];
      expect(urls.length).toBe(uniqueUrls.length);
    });
  });

  describe('fetch', () => {
    it('calls firecrawl.scrape with correct config', async () => {
      const firecrawl = mockFirecrawl(SAMPLE_MARKDOWN);
      const fetcher = new HtmlFetcher(firecrawl);

      await fetcher.fetch(HTML_CONFIG);

      expect(firecrawl.scrape).toHaveBeenCalledWith(
        HTML_CONFIG.url,
        expect.objectContaining({ formats: ['markdown'] }),
      );
    });

    it('returns empty array on scrape failure', async () => {
      const firecrawl = mockFirecrawl('', false);
      const fetcher = new HtmlFetcher(firecrawl);

      const articles = await fetcher.fetch(HTML_CONFIG);
      expect(articles).toHaveLength(0);
    });
  });
});
