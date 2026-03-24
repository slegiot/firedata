/**
 * Kysely table type definitions for the FireData database.
 *
 * These interfaces map 1:1 to the Postgres schema defined in
 * migrations/001_initial_schema.sql. Kysely uses these to provide
 * fully type-safe queries at compile time — no codegen needed.
 */
import type { ColumnType, Generated, Insertable, Selectable, Updateable } from 'kysely';

// ── Helpers ─────────────────────────────────────────────────────

/** Timestamp columns auto-set by Postgres DEFAULT NOW() */
type Timestamp = ColumnType<Date, Date | string | undefined, Date | string>;

/** JSONB columns stored as unknown, accepted as Record or array */
type JsonColumn<T = Record<string, unknown>> = ColumnType<T, T | string, T | string>;

// ══════════════════════════════════════════════════════════════
// 1. FINANCE
// ══════════════════════════════════════════════════════════════

export type AssetType = 'equity' | 'etf' | 'crypto';

export interface AssetTable {
  id: Generated<string>;
  symbol: string;
  asset_type: AssetType;
  exchange: string | null;
  name: string;
  metadata: JsonColumn;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface AssetPriceSnapshotTable {
  id: Generated<string>;
  asset_id: string;
  source: string;
  timestamp: Date | string;
  open: string | null;       // NUMERIC → string in JS
  high: string | null;
  low: string | null;
  close: string;
  volume: string | null;
  raw: JsonColumn;
  created_at: Timestamp;
}

export interface AssetFundamentalTable {
  id: Generated<string>;
  asset_id: string;
  source: string;
  period: string;
  period_start: Date | string;
  period_end: Date | string;
  data: JsonColumn;
  created_at: Timestamp;
}

// ══════════════════════════════════════════════════════════════
// 2. NEWS
// ══════════════════════════════════════════════════════════════

export interface NewsArticleTable {
  id: Generated<string>;
  source: string;
  url: string;
  title: string;
  summary: string | null;
  body: string | null;
  language: string | null;
  category: string | null;
  published_at: Date | string | null;
  scraped_at: Timestamp;
  raw: JsonColumn;
  created_at: Timestamp;
}

export interface NewsTagTable {
  id: Generated<string>;
  name: string;
}

export interface NewsArticleTagTable {
  article_id: string;
  tag_id: string;
}

// ══════════════════════════════════════════════════════════════
// 3. SPORTS
// ══════════════════════════════════════════════════════════════

export interface SportTable {
  id: Generated<string>;
  key: string;
  name: string;
}

export interface LeagueTable {
  id: Generated<string>;
  sport_id: string;
  name: string;
  country: string | null;
  level: number | null;
  external_ids: JsonColumn;
  created_at: Timestamp;
}

export interface TeamTable {
  id: Generated<string>;
  league_id: string;
  name: string;
  short_name: string | null;
  external_ids: JsonColumn;
  created_at: Timestamp;
}

export interface PlayerTable {
  id: Generated<string>;
  team_id: string | null;
  name: string;
  position: string | null;
  external_ids: JsonColumn;
  created_at: Timestamp;
}

export type GameStatus = 'scheduled' | 'live' | 'completed' | 'postponed' | 'cancelled';

export interface GameTable {
  id: Generated<string>;
  league_id: string;
  home_team_id: string | null;
  away_team_id: string | null;
  start_time: Date | string;
  status: GameStatus;
  score: JsonColumn;
  metadata: JsonColumn;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ══════════════════════════════════════════════════════════════
// 4. BETTING ODDS
// ══════════════════════════════════════════════════════════════

export interface BookmakerTable {
  id: Generated<string>;
  name: string;
  country: string | null;
  url: string | null;
  external_rank: number | null;
  created_at: Timestamp;
}

export interface MarketTable {
  id: Generated<string>;
  sport_id: string;
  key: string;
  name: string;
}

export interface OddsSnapshotTable {
  id: Generated<string>;
  bookmaker_id: string;
  game_id: string;
  market_id: string;
  captured_at: Timestamp;
  odds: JsonColumn;
  raw: JsonColumn;
  created_at: Timestamp;
}

// ══════════════════════════════════════════════════════════════
// 5. API KEYS
// ══════════════════════════════════════════════════════════════

export interface ApiKeyTable {
  id: Generated<string>;
  key_hash: string;
  key_prefix: string;          // First 8 chars for display (e.g., 'fd_live_Ab')
  owner: string;               // Label (e.g., 'my-app', 'dashboard')
  rate_limit: number;          // Requests per window
  rate_window_ms: number;      // Window duration in ms
  is_active: ColumnType<boolean, boolean | undefined, boolean>;
  usage_count: ColumnType<number, number | undefined, number>;
  last_used_at: ColumnType<Date | null, Date | string | undefined | null, Date | string | null>;
  created_at: Timestamp;
}

// ══════════════════════════════════════════════════════════════
// DATABASE INTERFACE
// ══════════════════════════════════════════════════════════════

export interface Database {
  // Finance
  assets: AssetTable;
  asset_price_snapshots: AssetPriceSnapshotTable;
  asset_fundamentals: AssetFundamentalTable;

  // News
  news_articles: NewsArticleTable;
  news_tags: NewsTagTable;
  news_article_tags: NewsArticleTagTable;

  // Sports
  sports: SportTable;
  leagues: LeagueTable;
  teams: TeamTable;
  players: PlayerTable;
  games: GameTable;

  // Betting
  bookmakers: BookmakerTable;
  markets: MarketTable;
  odds_snapshots: OddsSnapshotTable;

  // API Keys
  api_keys: ApiKeyTable;
}

// ── Convenience type aliases ────────────────────────────────────

export type Asset = Selectable<AssetTable>;
export type NewAsset = Insertable<AssetTable>;
export type AssetUpdate = Updateable<AssetTable>;

export type AssetPriceSnapshot = Selectable<AssetPriceSnapshotTable>;
export type NewAssetPriceSnapshot = Insertable<AssetPriceSnapshotTable>;

export type AssetFundamental = Selectable<AssetFundamentalTable>;
export type NewAssetFundamental = Insertable<AssetFundamentalTable>;

export type NewsArticle = Selectable<NewsArticleTable>;
export type NewNewsArticle = Insertable<NewsArticleTable>;

export type NewsTag = Selectable<NewsTagTable>;
export type NewNewsTag = Insertable<NewsTagTable>;

export type Sport = Selectable<SportTable>;
export type League = Selectable<LeagueTable>;
export type NewLeague = Insertable<LeagueTable>;
export type Team = Selectable<TeamTable>;
export type NewTeam = Insertable<TeamTable>;
export type Player = Selectable<PlayerTable>;
export type NewPlayer = Insertable<PlayerTable>;
export type Game = Selectable<GameTable>;
export type NewGame = Insertable<GameTable>;
export type GameUpdate = Updateable<GameTable>;

export type Bookmaker = Selectable<BookmakerTable>;
export type NewBookmaker = Insertable<BookmakerTable>;
export type Market = Selectable<MarketTable>;
export type NewMarket = Insertable<MarketTable>;
export type OddsSnapshot = Selectable<OddsSnapshotTable>;
export type NewOddsSnapshot = Insertable<OddsSnapshotTable>;

export type ApiKey = Selectable<ApiKeyTable>;
export type NewApiKey = Insertable<ApiKeyTable>;
export type ApiKeyUpdate = Updateable<ApiKeyTable>;
