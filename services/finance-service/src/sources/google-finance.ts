/**
 * Google Finance HTML scraper using Firecrawl.
 *
 * Second source for price data — provides redundancy and
 * cross-validation against Yahoo Finance.
 */
import type { Asset } from '@firedata/shared-db';
import type { FirecrawlClient } from '@firedata/shared-firecrawl-client';
import type { PriceSource, PriceSnapshotInput } from './types.js';

export class GoogleFinanceSource implements PriceSource {
  readonly name = 'google-finance';
  readonly priority = 2; // Lower trust than Yahoo
  readonly supportedTypes: Asset['asset_type'][] = ['equity', 'etf'];

  constructor(private readonly firecrawl: FirecrawlClient) {}

  async fetchSnapshot(asset: Asset): Promise<PriceSnapshotInput | null> {
    if (asset.asset_type === 'crypto') return null; // Not supported

    const url = `https://www.google.com/finance/quote/${asset.symbol}:${asset.exchange ?? 'NASDAQ'}`;

    try {
      const result = await this.firecrawl.scrape(url, {
        formats: ['markdown'],
        timeout: 15_000,
      });

      if (!result.success || !result.data.markdown) return null;

      return this.parseMarkdown(result.data.markdown, result.data.url);
    } catch (err) {
      console.error(`[google-finance] Failed to scrape ${asset.symbol}:`, err);
      return null;
    }
  }

  parseMarkdown(markdown: string, sourceUrl: string): PriceSnapshotInput | null {
    // Google Finance markdown typically has patterns like:
    // "$123.45" or "123.45 USD"
    const priceMatch = markdown.match(/\$\s*([\d,]+\.?\d*)/);
    if (!priceMatch) return null;

    const price = priceMatch[1].replace(/,/g, '');

    return {
      source: this.name,
      timestamp: new Date(),
      open: null,
      high: null,
      low: null,
      close: price,
      volume: null,
      raw: { sourceUrl, markdownLength: markdown.length },
    };
  }
}
