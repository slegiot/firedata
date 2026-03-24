/**
 * Yahoo Finance HTML scraper using Firecrawl.
 *
 * Scrapes the Yahoo Finance quote page for a given ticker symbol
 * and parses the price data from the resulting markdown.
 */
import type { Asset } from '@firedata/shared-db';
import type { FirecrawlClient } from '@firedata/shared-firecrawl-client';
import type { PriceSource, PriceSnapshotInput } from './types.js';

export class YahooFinanceSource implements PriceSource {
  readonly name = 'yahoo-finance';
  readonly priority = 1;
  readonly supportedTypes: Asset['asset_type'][] = ['equity', 'etf', 'crypto'];

  constructor(private readonly firecrawl: FirecrawlClient) {}

  async fetchSnapshot(asset: Asset): Promise<PriceSnapshotInput | null> {
    const url = this.buildUrl(asset);
    try {
      const result = await this.firecrawl.scrape(url, {
        formats: ['markdown'],
        timeout: 15_000,
      });

      if (!result.success || !result.data.markdown) {
        return null;
      }

      return this.parseMarkdown(result.data.markdown, result.data.url);
    } catch (err) {
      console.error(`[yahoo-finance] Failed to scrape ${asset.symbol}:`, err);
      return null;
    }
  }

  private buildUrl(asset: Asset): string {
    if (asset.asset_type === 'crypto') {
      // Crypto tickers on Yahoo use the format BTC-USD
      const symbol = asset.symbol.includes('-')
        ? asset.symbol
        : `${asset.symbol}-USD`;
      return `https://finance.yahoo.com/quote/${symbol}/`;
    }
    return `https://finance.yahoo.com/quote/${asset.symbol}/`;
  }

  /**
   * Parse price data from Yahoo Finance markdown output.
   *
   * Yahoo's quote page markdown typically contains patterns like:
   *   - "**123.45** +1.23 (+1.01%)" for current price
   *   - "Previous Close 121.50"
   *   - "Open 122.00"
   *   - "Day's Range 121.50 - 124.00"
   *   - "Volume 1,234,567"
   */
  parseMarkdown(markdown: string, sourceUrl: string): PriceSnapshotInput | null {
    const price = this.extractPrice(markdown);
    if (!price) return null;

    const open = this.extractField(markdown, 'Open');
    const dayRange = this.extractDayRange(markdown);
    const volume = this.extractField(markdown, 'Volume');

    return {
      source: this.name,
      timestamp: new Date(),
      open: open ? this.cleanNumber(open) : null,
      high: dayRange?.high ? this.cleanNumber(dayRange.high) : null,
      low: dayRange?.low ? this.cleanNumber(dayRange.low) : null,
      close: this.cleanNumber(price),
      volume: volume ? this.cleanNumber(volume) : null,
      raw: { sourceUrl, markdownLength: markdown.length },
    };
  }

  private extractPrice(markdown: string): string | null {
    // Pattern: bold price like **123.45** or a standalone large number
    const boldMatch = markdown.match(/\*\*\s*([\d,]+\.?\d*)\s*\*\*/);
    if (boldMatch) return boldMatch[1];

    // Fallback: "Previous Close XXX" as the price indicator
    const prevClose = this.extractField(markdown, 'Previous Close');
    return prevClose;
  }

  /**
   * Extract a numeric field value from markdown.
   * Handles both table format (| Label | Value |) and plain text (Label Value).
   */
  private extractField(markdown: string, label: string): string | null {
    // Table format: | Open | 188.01 |
    const tablePattern = new RegExp(
      `\\|\\s*${label}\\s*\\|\\s*([\\d,]+\\.?\\d*)\\s*\\|`,
      'i',
    );
    const tableMatch = markdown.match(tablePattern);
    if (tableMatch) return tableMatch[1];

    // Plain text format: Open 188.01
    const plainPattern = new RegExp(`${label}\\s+([\\d,]+\\.?\\d*)`, 'i');
    const plainMatch = markdown.match(plainPattern);
    return plainMatch ? plainMatch[1] : null;
  }

  private extractDayRange(
    markdown: string,
  ): { low: string; high: string } | null {
    // Table format: | Day's Range | 121.50 - 124.00 |
    const tableMatch = markdown.match(
      /\|\s*Day['']?s?\s+Range\s*\|\s*([\d,.]+)\s*[-–]\s*([\d,.]+)\s*\|/i,
    );
    if (tableMatch) return { low: tableMatch[1], high: tableMatch[2] };

    // Plain text format: Day's Range 121.50 - 124.00
    const plainMatch = markdown.match(
      /Day['']?s?\s+Range\s+([\d,.]+)\s*[-–]\s*([\d,.]+)/i,
    );
    if (!plainMatch) return null;
    return { low: plainMatch[1], high: plainMatch[2] };
  }

  /** Remove commas and whitespace from number strings. */
  private cleanNumber(value: string): string {
    return value.replace(/[,\s]/g, '');
  }
}
