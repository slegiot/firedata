import { describe, it, expect } from 'vitest';
import { RssFetcher } from '../src/sources/rss-fetcher.js';
import type { NewsSourceConfig } from '../src/sources/types.js';

const RSS_CONFIG: NewsSourceConfig = {
  id: 'test-rss',
  name: 'Test RSS',
  type: 'rss',
  url: 'https://example.com/feed.xml',
  category: 'finance',
  updateFrequencyMs: 300_000,
  enabled: true,
};

// ── Sample RSS 2.0 feed ────────────────────────────────────────

const RSS_20_XML = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Finance Feed</title>
    <link>https://example.com</link>
    <description>Latest finance news</description>
    <item>
      <title>Stock Market Hits Record High</title>
      <link>https://example.com/article/1</link>
      <description>The &lt;b&gt;S&amp;P 500&lt;/b&gt; reached an all-time high today.</description>
      <pubDate>Mon, 24 Mar 2026 12:00:00 GMT</pubDate>
    </item>
    <item>
      <title>Fed Announces Rate Decision</title>
      <link>https://example.com/article/2</link>
      <description>The Federal Reserve held rates steady at 4.5%.</description>
      <pubDate>Mon, 24 Mar 2026 10:00:00 GMT</pubDate>
    </item>
    <item>
      <title></title>
      <link>https://example.com/article/3</link>
      <description>Article with empty title should be skipped.</description>
    </item>
  </channel>
</rss>`;

// ── Sample Atom feed ───────────────────────────────────────────

const ATOM_XML = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Tech News</title>
  <entry>
    <title>AI Revolution Continues</title>
    <link href="https://example.com/tech/ai" />
    <summary>Artificial intelligence advances accelerate.</summary>
    <published>2026-03-24T08:00:00Z</published>
  </entry>
  <entry>
    <title>Startup Raises $100M</title>
    <link href="https://example.com/tech/startup" />
    <summary>A new startup raised a major round.</summary>
    <updated>2026-03-23T16:00:00Z</updated>
  </entry>
</feed>`;

const MALFORMED_XML = `<not valid xml at all {{{}}}`;

// ── Tests ──────────────────────────────────────────────────────

describe('RssFetcher', () => {
  const fetcher = new RssFetcher();

  describe('RSS 2.0 parsing', () => {
    it('extracts articles from RSS 2.0 XML', () => {
      const articles = fetcher.parse(RSS_20_XML, RSS_CONFIG);

      expect(articles).toHaveLength(2); // Empty title is skipped
      expect(articles[0].title).toBe('Stock Market Hits Record High');
      expect(articles[0].url).toBe('https://example.com/article/1');
      expect(articles[0].sourceName).toBe('Test RSS');
      expect(articles[0].sourceId).toBe('test-rss');
      expect(articles[0].categoryHint).toBe('finance');
    });

    it('strips HTML from descriptions', () => {
      const articles = fetcher.parse(RSS_20_XML, RSS_CONFIG);

      expect(articles[0].summary).toBe('The S&P 500 reached an all-time high today.');
    });

    it('parses pubDate correctly', () => {
      const articles = fetcher.parse(RSS_20_XML, RSS_CONFIG);

      expect(articles[0].publishedAt).toBeInstanceOf(Date);
      expect(articles[0].publishedAt!.toISOString()).toContain('2026-03-24');
    });

    it('handles second article correctly', () => {
      const articles = fetcher.parse(RSS_20_XML, RSS_CONFIG);

      expect(articles[1].title).toBe('Fed Announces Rate Decision');
      expect(articles[1].summary).toBe('The Federal Reserve held rates steady at 4.5%.');
    });
  });

  describe('Atom parsing', () => {
    it('extracts articles from Atom XML', () => {
      const articles = fetcher.parse(ATOM_XML, RSS_CONFIG);

      expect(articles).toHaveLength(2);
      expect(articles[0].title).toBe('AI Revolution Continues');
      expect(articles[0].url).toBe('https://example.com/tech/ai');
      expect(articles[0].summary).toBe('Artificial intelligence advances accelerate.');
    });

    it('parses Atom link href attribute', () => {
      const articles = fetcher.parse(ATOM_XML, RSS_CONFIG);

      expect(articles[1].url).toBe('https://example.com/tech/startup');
    });

    it('parses published date from Atom', () => {
      const articles = fetcher.parse(ATOM_XML, RSS_CONFIG);

      expect(articles[0].publishedAt).toBeInstanceOf(Date);
    });

    it('falls back to updated date when published is missing', () => {
      const articles = fetcher.parse(ATOM_XML, RSS_CONFIG);

      expect(articles[1].publishedAt).toBeInstanceOf(Date);
      expect(articles[1].publishedAt!.toISOString()).toContain('2026-03-23');
    });
  });

  describe('error handling', () => {
    it('returns empty array for malformed XML', () => {
      const articles = fetcher.parse(MALFORMED_XML, RSS_CONFIG);
      expect(articles).toHaveLength(0);
    });

    it('returns empty array for empty XML', () => {
      const articles = fetcher.parse('', RSS_CONFIG);
      expect(articles).toHaveLength(0);
    });

    it('handles single-item feed (not wrapped in array)', () => {
      const singleItemXml = `<?xml version="1.0"?>
      <rss version="2.0">
        <channel>
          <item>
            <title>Single Article</title>
            <link>https://example.com/single</link>
          </item>
        </channel>
      </rss>`;

      const articles = fetcher.parse(singleItemXml, RSS_CONFIG);
      expect(articles).toHaveLength(1);
      expect(articles[0].title).toBe('Single Article');
    });
  });
});
