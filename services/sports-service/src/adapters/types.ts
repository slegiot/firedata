/**
 * Sports adapter interface.
 *
 * Each sport/league adapter implements this shared interface.
 * Adapters can use Firecrawl (HTML scraping) or JSON APIs.
 */
import type { GameStatus } from '@firedata/shared-db';

/** A normalized game from any upstream provider. */
export interface NormalizedGame {
  /** External game ID from the provider. */
  externalId: string;
  /** Home team name (upserted into teams table). */
  homeTeam: string;
  /** Away team name (upserted into teams table). */
  awayTeam: string;
  /** Home team short name / abbreviation. */
  homeTeamShort: string | null;
  /** Away team short name / abbreviation. */
  awayTeamShort: string | null;
  /** Game start time. */
  startTime: Date;
  /** Current status. */
  status: GameStatus;
  /** Score object (sport-specific structure). */
  score: Record<string, unknown>;
  /** Extra metadata (venue, round, etc.). */
  metadata: Record<string, unknown>;
}

/** Configuration for a league adapter. */
export interface LeagueAdapterConfig {
  /** League name (must match seed data). */
  leagueName: string;
  /** Sport key (must match seed data). */
  sportKey: string;
  /** Adapter type identifier. */
  adapterType: string;
  /** Source URL (feed or page URL). */
  url: string;
  /** How often to poll, in ms. */
  updateFrequencyMs: number;
  /** Whether this adapter is active. */
  enabled: boolean;
}

/**
 * Interface that all sport/league adapters must implement.
 *
 * An adapter fetches game data from one upstream source for one league.
 */
export interface LeagueAdapter {
  /** Unique adapter type identifier (e.g., 'football-data', 'espn-scraper'). */
  readonly type: string;

  /** Fetch upcoming and recent games for the configured league. */
  fetchGames(config: LeagueAdapterConfig): Promise<NormalizedGame[]>;
}
