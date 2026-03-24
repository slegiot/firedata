/**
 * Odds source registry.
 */
import type { FirecrawlClient } from '@firedata/shared-firecrawl-client';
import type { Bookmaker, Game } from '@firedata/shared-db';
import type { OddsSource, OddsSnapshotInput } from './types.js';
import { SoccerOddsAdapter } from './soccer-odds.js';

export class OddsSourceRegistry {
  private sources: Map<string, OddsSource> = new Map();

  constructor(firecrawl: FirecrawlClient) {
    const soccer = new SoccerOddsAdapter(firecrawl);
    this.sources.set(soccer.type, soccer);
  }

  /** Register a custom odds source. */
  register(source: OddsSource): void {
    this.sources.set(source.type, source);
  }

  /** Get a source by type. */
  get(type: string): OddsSource | undefined {
    return this.sources.get(type);
  }

  /** Fetch odds from a specific source type. */
  async fetchOdds(
    sourceType: string,
    bookmaker: Bookmaker,
    game: Game,
    marketKeys: string[],
  ): Promise<OddsSnapshotInput | null> {
    const source = this.sources.get(sourceType);
    if (!source) {
      console.error(`[odds-registry] Unknown source type: ${sourceType}`);
      return null;
    }
    return source.fetchOddsForGame(bookmaker, game, marketKeys);
  }
}
