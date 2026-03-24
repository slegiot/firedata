/**
 * Odds source types and interfaces.
 */
import type { Bookmaker, Game, Market } from '@firedata/shared-db';

/** Parsed odds values for a single market. */
export interface OddsValues {
  /** Market key (e.g., 'match_winner_1x2'). */
  marketKey: string;
  /** Odds data — structure depends on market type. */
  odds: Record<string, unknown>;
  /** Raw scrape data for audit. */
  raw: Record<string, unknown>;
}

/** Result of fetching odds from a single source. */
export interface OddsSnapshotInput {
  /** Bookmaker that provided the odds. */
  bookmakerId: string;
  /** Game the odds are for. */
  gameId: string;
  /** When the odds were captured. */
  capturedAt: Date;
  /** Odds for each requested market. */
  markets: OddsValues[];
}

/**
 * Interface that all odds source adapters must implement.
 *
 * An odds source knows how to fetch odds from one bookmaker for a given game.
 */
export interface OddsSource {
  /** Unique source type identifier. */
  readonly type: string;

  /**
   * Fetch odds for a specific game from a specific bookmaker.
   *
   * @param bookmaker — The bookmaker to fetch from.
   * @param game — The game to get odds for.
   * @param marketKeys — Which markets to fetch (e.g., ['match_winner_1x2', 'over_under_2_5']).
   */
  fetchOddsForGame(
    bookmaker: Bookmaker,
    game: Game,
    marketKeys: string[],
  ): Promise<OddsSnapshotInput | null>;
}

/** Configuration for a bookmaker odds source. */
export interface OddsSourceConfig {
  /** Bookmaker name (must match seed data). */
  bookmakerName: string;
  /** Source adapter type. */
  adapterType: string;
  /** Base URL pattern for odds pages. */
  baseUrl: string;
  /** Whether this source is active. */
  enabled: boolean;
}
