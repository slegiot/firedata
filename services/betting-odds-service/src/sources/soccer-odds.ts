/**
 * Soccer 1X2 odds adapter using Firecrawl HTML scraping.
 *
 * Scrapes bookmaker odds pages and parses match winner (1X2) odds
 * for soccer matches. This is the concrete example adapter.
 */
import type { FirecrawlClient } from '@firedata/shared-firecrawl-client';
import type { Bookmaker, Game } from '@firedata/shared-db';
import type { OddsSource, OddsSnapshotInput, OddsValues } from './types.js';

export class SoccerOddsAdapter implements OddsSource {
  readonly type = 'soccer-odds-html';

  constructor(private readonly firecrawl: FirecrawlClient) {}

  async fetchOddsForGame(
    bookmaker: Bookmaker,
    game: Game,
    marketKeys: string[],
  ): Promise<OddsSnapshotInput | null> {
    if (!bookmaker.url) {
      console.warn(`[soccer-odds] ${bookmaker.name}: No URL configured`);
      return null;
    }

    try {
      // Construct the odds page URL from the bookmaker base URL
      const oddsUrl = this.buildOddsUrl(bookmaker.url, game);

      const result = await this.firecrawl.scrape(oddsUrl, {
        formats: ['markdown'],
        timeout: 20_000,
      });

      if (!result.success || !result.data.markdown) {
        console.error(`[soccer-odds] ${bookmaker.name}: Scrape failed for ${oddsUrl}`);
        return null;
      }

      const markets = this.parseOdds(result.data.markdown, marketKeys);

      if (markets.length === 0) return null;

      return {
        bookmakerId: bookmaker.id,
        gameId: game.id,
        capturedAt: new Date(),
        markets,
      };
    } catch (err) {
      console.error(`[soccer-odds] ${bookmaker.name}: Error:`, err);
      return null;
    }
  }

  /**
   * Parse odds from markdown content. Exported for testing.
   *
   * Looks for patterns like:
   * - "Home 1.85 | Draw 3.40 | Away 4.20"
   * - "1: 1.85  X: 3.40  2: 4.20"
   * - Table rows: | Home | 1.85 | Draw | 3.40 | Away | 4.20 |
   */
  parseOdds(markdown: string, marketKeys: string[]): OddsValues[] {
    const markets: OddsValues[] = [];

    if (marketKeys.includes('match_winner_1x2')) {
      const odds1x2 = this.parse1X2(markdown);
      if (odds1x2) {
        markets.push(odds1x2);
      }
    }

    if (marketKeys.includes('over_under_2_5')) {
      const oddsOU = this.parseOverUnder(markdown);
      if (oddsOU) {
        markets.push(oddsOU);
      }
    }

    return markets;
  }

  /** Parse 1X2 (match winner) odds. */
  private parse1X2(markdown: string): OddsValues | null {
    // Pattern: "1" or "Home" followed by decimal odds, then "X" or "Draw", then "2" or "Away"
    const patterns = [
      // "Home 1.85 | Draw 3.40 | Away 4.20" or "Home 1.85 Draw 3.40 Away 4.20"
      /(?:home|1)\s*[:=]?\s*(\d+\.\d{1,3})\s*[|,]?\s*(?:draw|x)\s*[:=]?\s*(\d+\.\d{1,3})\s*[|,]?\s*(?:away|2)\s*[:=]?\s*(\d+\.\d{1,3})/i,
      // Table: | 1.85 | 3.40 | 4.20 | (common odds table format)
      /\|\s*(\d+\.\d{1,3})\s*\|\s*(\d+\.\d{1,3})\s*\|\s*(\d+\.\d{1,3})\s*\|/,
      // Compact: "1.85 / 3.40 / 4.20"
      /(\d+\.\d{1,3})\s*\/\s*(\d+\.\d{1,3})\s*\/\s*(\d+\.\d{1,3})/,
    ];

    for (const pattern of patterns) {
      const match = markdown.match(pattern);
      if (match) {
        const [, home, draw, away] = match;
        return {
          marketKey: 'match_winner_1x2',
          odds: {
            home: parseFloat(home),
            draw: parseFloat(draw),
            away: parseFloat(away),
          },
          raw: { matchedPattern: match[0] },
        };
      }
    }

    return null;
  }

  /** Parse Over/Under 2.5 goals odds. */
  private parseOverUnder(markdown: string): OddsValues | null {
    // Pattern: "Over 2.5" followed by odds, then "Under 2.5" followed by odds
    const pattern = /over\s*2\.5\s*[:=]?\s*(\d+\.\d{1,3})\s*[|,/]?\s*under\s*2\.5\s*[:=]?\s*(\d+\.\d{1,3})/i;
    const match = markdown.match(pattern);

    if (match) {
      return {
        marketKey: 'over_under_2_5',
        odds: {
          over: parseFloat(match[1]),
          under: parseFloat(match[2]),
        },
        raw: { matchedPattern: match[0] },
      };
    }

    return null;
  }

  /** Build a plausible odds page URL from the bookmaker base. */
  private buildOddsUrl(baseUrl: string, game: Game): string {
    // In practice, each bookmaker has a unique URL structure.
    // This generic approach appends the game metadata for lookup.
    const meta = game.metadata as Record<string, unknown>;
    const slug = meta?.externalId || game.id;
    return `${baseUrl.replace(/\/$/, '')}/sports/soccer/${slug}`;
  }
}
