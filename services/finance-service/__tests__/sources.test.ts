import { describe, it, expect, vi, beforeEach } from 'vitest';
import { YahooFinanceSource } from '../src/sources/yahoo-finance.js';
import { GoogleFinanceSource } from '../src/sources/google-finance.js';
import { SourceRegistry } from '../src/sources/registry.js';
import type { Asset } from '@firedata/shared-db';
import type { PriceSnapshotInput } from '../src/sources/types.js';

// ── Mock Firecrawl client ───────────────────────────────────

function mockFirecrawl(markdown: string, success = true) {
  return {
    scrape: vi.fn().mockResolvedValue({
      success,
      data: {
        url: 'https://finance.yahoo.com/quote/AAPL/',
        markdown: success ? markdown : '',
        metadata: { title: 'AAPL', sourceURL: 'https://finance.yahoo.com/quote/AAPL/', statusCode: 200 },
      },
    }),
  } as any;
}

const MOCK_ASSET: Asset = {
  id: 'test-uuid',
  symbol: 'AAPL',
  asset_type: 'equity',
  exchange: 'NASDAQ',
  name: 'Apple Inc.',
  metadata: {},
  created_at: new Date(),
  updated_at: new Date(),
};

const CRYPTO_ASSET: Asset = {
  ...MOCK_ASSET,
  id: 'crypto-uuid',
  symbol: 'BTC',
  asset_type: 'crypto',
  name: 'Bitcoin',
  exchange: null,
};

// ══════════════════════════════════════════════════════════════
// Yahoo Finance parsing tests
// ══════════════════════════════════════════════════════════════

describe('YahooFinanceSource', () => {
  describe('parseMarkdown', () => {
    it('extracts price, open, day range, and volume', () => {
      const markdown = `
# Apple Inc. (AAPL)

**189.84** +2.15 (+1.15%)

At close: 4:00 PM EST

| Metric | Value |
|--------|-------|
| Previous Close | 187.69 |
| Open | 188.01 |
| Day's Range | 187.45 - 190.12 |
| Volume | 48,234,567 |
| Market Cap | 2.95T |
`;

      const firecrawl = mockFirecrawl(markdown);
      const source = new YahooFinanceSource(firecrawl);
      const result = source.parseMarkdown(markdown, 'https://finance.yahoo.com/quote/AAPL/');

      expect(result).not.toBeNull();
      expect(result!.source).toBe('yahoo-finance');
      expect(result!.close).toBe('189.84');
      expect(result!.open).toBe('188.01');
      expect(result!.high).toBe('190.12');
      expect(result!.low).toBe('187.45');
      expect(result!.volume).toBe('48234567');
      expect(result!.timestamp).toBeInstanceOf(Date);
    });

    it('handles comma-separated price values', () => {
      const markdown = `
# Berkshire Hathaway (BRK-A)

**623,451.00** +1,234.00 (+0.20%)

| Metric | Value |
|--------|-------|
| Open | 622,100.00 |
| Day's Range | 621,500.00 - 624,000.00 |
| Volume | 1,234 |
`;

      const firecrawl = mockFirecrawl(markdown);
      const source = new YahooFinanceSource(firecrawl);
      const result = source.parseMarkdown(markdown, 'https://finance.yahoo.com/quote/BRK-A/');

      expect(result!.close).toBe('623451.00');
      expect(result!.open).toBe('622100.00');
      expect(result!.high).toBe('624000.00');
      expect(result!.low).toBe('621500.00');
      expect(result!.volume).toBe('1234');
    });

    it('handles crypto prices with small decimals', () => {
      const markdown = `
# Bitcoin USD (BTC-USD)

**67,234.56** +1,200.00 (+1.82%)

| Metric | Value |
|--------|-------|
| Open | 66,034.56 |
| Day's Range | 65,800.12 - 67,500.00 |
| Volume | 28,456,789,012 |
`;

      const firecrawl = mockFirecrawl(markdown);
      const source = new YahooFinanceSource(firecrawl);
      const result = source.parseMarkdown(markdown, 'https://finance.yahoo.com/quote/BTC-USD/');

      expect(result!.close).toBe('67234.56');
      expect(result!.open).toBe('66034.56');
    });

    it('returns null when no price is found', () => {
      const markdown = `# Error\nThis page could not be found.`;

      const firecrawl = mockFirecrawl(markdown);
      const source = new YahooFinanceSource(firecrawl);
      const result = source.parseMarkdown(markdown, 'https://finance.yahoo.com/quote/INVALID/');

      expect(result).toBeNull();
    });

    it('extracts price from Previous Close when bold price missing', () => {
      const markdown = `
# Apple Inc. (AAPL)

Some description text without bold price.

| Metric | Value |
|--------|-------|
| Previous Close | 187.69 |
| Open | 188.01 |
`;

      const firecrawl = mockFirecrawl(markdown);
      const source = new YahooFinanceSource(firecrawl);
      const result = source.parseMarkdown(markdown, 'https://finance.yahoo.com/quote/AAPL/');

      expect(result).not.toBeNull();
      expect(result!.close).toBe('187.69');
    });
  });

  describe('fetchSnapshot', () => {
    it('calls firecrawl with correct URL for equities', async () => {
      const firecrawl = mockFirecrawl('**150.00**');
      const source = new YahooFinanceSource(firecrawl);

      await source.fetchSnapshot(MOCK_ASSET);

      expect(firecrawl.scrape).toHaveBeenCalledWith(
        'https://finance.yahoo.com/quote/AAPL/',
        expect.objectContaining({ formats: ['markdown'] }),
      );
    });

    it('uses BTC-USD format for crypto without dash', async () => {
      const firecrawl = mockFirecrawl('**67000.00**');
      const source = new YahooFinanceSource(firecrawl);

      await source.fetchSnapshot(CRYPTO_ASSET);

      expect(firecrawl.scrape).toHaveBeenCalledWith(
        'https://finance.yahoo.com/quote/BTC-USD/',
        expect.any(Object),
      );
    });

    it('returns null on scrape failure', async () => {
      const firecrawl = mockFirecrawl('', false);
      const source = new YahooFinanceSource(firecrawl);

      const result = await source.fetchSnapshot(MOCK_ASSET);
      expect(result).toBeNull();
    });
  });
});

// ══════════════════════════════════════════════════════════════
// Google Finance parsing tests
// ══════════════════════════════════════════════════════════════

describe('GoogleFinanceSource', () => {
  describe('parseMarkdown', () => {
    it('extracts price from dollar format', () => {
      const markdown = `
# Apple Inc
## AAPL · NASDAQ

$189.84

+2.15 (1.15%) today
`;

      const firecrawl = mockFirecrawl(markdown);
      const source = new GoogleFinanceSource(firecrawl);
      const result = source.parseMarkdown(markdown, 'https://www.google.com/finance/quote/AAPL:NASDAQ');

      expect(result!.close).toBe('189.84');
      expect(result!.source).toBe('google-finance');
    });

    it('returns null for crypto (not supported)', async () => {
      const firecrawl = mockFirecrawl('$67000');
      const source = new GoogleFinanceSource(firecrawl);

      const result = await source.fetchSnapshot(CRYPTO_ASSET);
      expect(result).toBeNull();
    });
  });
});

// ══════════════════════════════════════════════════════════════
// Source Registry tests
// ══════════════════════════════════════════════════════════════

describe('SourceRegistry', () => {
  let registry: SourceRegistry;

  beforeEach(() => {
    registry = new SourceRegistry();
  });

  it('registers sources sorted by priority', () => {
    const lowPriority = {
      name: 'low',
      priority: 10,
      supportedTypes: ['equity' as const],
      fetchSnapshot: vi.fn(),
    };
    const highPriority = {
      name: 'high',
      priority: 1,
      supportedTypes: ['equity' as const],
      fetchSnapshot: vi.fn(),
    };

    registry.register(lowPriority);
    registry.register(highPriority);

    expect(registry.getSourceNames()).toEqual(['high', 'low']);
  });

  it('fetchBest returns the most trusted source when timestamps are close', async () => {
    const now = new Date();
    const trusted: PriceSnapshotInput = {
      source: 'trusted',
      timestamp: now,
      open: null, high: null, low: null,
      close: '100.00',
      volume: null,
      raw: {},
    };
    const untrusted: PriceSnapshotInput = {
      source: 'untrusted',
      timestamp: now,
      open: null, high: null, low: null,
      close: '99.00',
      volume: null,
      raw: {},
    };

    registry.register({
      name: 'trusted',
      priority: 1,
      supportedTypes: ['equity'],
      fetchSnapshot: vi.fn().mockResolvedValue(trusted),
    });
    registry.register({
      name: 'untrusted',
      priority: 5,
      supportedTypes: ['equity'],
      fetchSnapshot: vi.fn().mockResolvedValue(untrusted),
    });

    const result = await registry.fetchBest(MOCK_ASSET);
    expect(result!.source).toBe('trusted');
    expect(result!.close).toBe('100.00');
  });

  it('fetchBest prefers fresher timestamp when >60s apart', async () => {
    const old = new Date(Date.now() - 120_000);
    const fresh = new Date();

    registry.register({
      name: 'stale-but-trusted',
      priority: 1,
      supportedTypes: ['equity'],
      fetchSnapshot: vi.fn().mockResolvedValue({
        source: 'stale-but-trusted',
        timestamp: old,
        open: null, high: null, low: null,
        close: '99.00',
        volume: null,
        raw: {},
      }),
    });
    registry.register({
      name: 'fresh-but-low-trust',
      priority: 10,
      supportedTypes: ['equity'],
      fetchSnapshot: vi.fn().mockResolvedValue({
        source: 'fresh-but-low-trust',
        timestamp: fresh,
        open: null, high: null, low: null,
        close: '101.00',
        volume: null,
        raw: {},
      }),
    });

    const result = await registry.fetchBest(MOCK_ASSET);
    expect(result!.source).toBe('fresh-but-low-trust');
  });

  it('fetchAll returns results from all applicable sources', async () => {
    registry.register({
      name: 'src-a',
      priority: 1,
      supportedTypes: ['equity'],
      fetchSnapshot: vi.fn().mockResolvedValue({
        source: 'src-a', timestamp: new Date(),
        open: null, high: null, low: null, close: '1', volume: null, raw: {},
      }),
    });
    registry.register({
      name: 'src-b',
      priority: 2,
      supportedTypes: ['equity'],
      fetchSnapshot: vi.fn().mockResolvedValue({
        source: 'src-b', timestamp: new Date(),
        open: null, high: null, low: null, close: '2', volume: null, raw: {},
      }),
    });

    const results = await registry.fetchAll(MOCK_ASSET);
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.source)).toEqual(['src-a', 'src-b']);
  });

  it('returns null when no sources support the asset type', async () => {
    registry.register({
      name: 'equity-only',
      priority: 1,
      supportedTypes: ['equity'],
      fetchSnapshot: vi.fn(),
    });

    const result = await registry.fetchBest(CRYPTO_ASSET);
    expect(result).toBeNull();
  });

  it('handles source failures gracefully', async () => {
    registry.register({
      name: 'failing',
      priority: 1,
      supportedTypes: ['equity'],
      fetchSnapshot: vi.fn().mockRejectedValue(new Error('timeout')),
    });
    registry.register({
      name: 'working',
      priority: 2,
      supportedTypes: ['equity'],
      fetchSnapshot: vi.fn().mockResolvedValue({
        source: 'working', timestamp: new Date(),
        open: null, high: null, low: null, close: '100', volume: null, raw: {},
      }),
    });

    const result = await registry.fetchBest(MOCK_ASSET);
    expect(result!.source).toBe('working');
  });
});
