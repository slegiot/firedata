/**
 * Default news source configurations.
 *
 * These can be extended via DB/env in the future, but hardcoded
 * defaults give us a working pipeline out of the box.
 */
import type { NewsSourceConfig } from './types.js';

const FIVE_MINUTES = 5 * 60 * 1000;
const FIFTEEN_MINUTES = 15 * 60 * 1000;
const THIRTY_MINUTES = 30 * 60 * 1000;

export const DEFAULT_SOURCES: NewsSourceConfig[] = [
  // ── RSS feeds ──────────────────────────────────────────────
  {
    id: 'reuters-business',
    name: 'Reuters Business',
    type: 'rss',
    url: 'https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best',
    category: 'finance',
    updateFrequencyMs: FIFTEEN_MINUTES,
    enabled: true,
  },
  {
    id: 'reuters-world',
    name: 'Reuters World',
    type: 'rss',
    url: 'https://www.reutersagency.com/feed/?best-topics=political-general&post_type=best',
    category: 'politics',
    updateFrequencyMs: FIFTEEN_MINUTES,
    enabled: true,
  },
  {
    id: 'bbc-sport',
    name: 'BBC Sport',
    type: 'rss',
    url: 'https://feeds.bbci.co.uk/sport/rss.xml',
    category: 'sports',
    updateFrequencyMs: FIFTEEN_MINUTES,
    enabled: true,
  },
  {
    id: 'coindesk',
    name: 'CoinDesk',
    type: 'rss',
    url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
    category: 'crypto',
    updateFrequencyMs: FIFTEEN_MINUTES,
    enabled: true,
  },
  {
    id: 'techcrunch',
    name: 'TechCrunch',
    type: 'rss',
    url: 'https://techcrunch.com/feed/',
    category: 'technology',
    updateFrequencyMs: THIRTY_MINUTES,
    enabled: true,
  },
  {
    id: 'espn-top',
    name: 'ESPN Top',
    type: 'rss',
    url: 'https://www.espn.com/espn/rss/news',
    category: 'sports',
    updateFrequencyMs: FIFTEEN_MINUTES,
    enabled: true,
  },

  // ── HTML / Firecrawl sources ───────────────────────────────
  {
    id: 'bloomberg-markets',
    name: 'Bloomberg Markets',
    type: 'html',
    url: 'https://www.bloomberg.com/markets',
    category: 'finance',
    updateFrequencyMs: THIRTY_MINUTES,
    enabled: true,
  },
  {
    id: 'the-athletic',
    name: 'The Athletic',
    type: 'html',
    url: 'https://www.nytimes.com/athletic/',
    category: 'sports',
    updateFrequencyMs: THIRTY_MINUTES,
    enabled: true,
  },
];
