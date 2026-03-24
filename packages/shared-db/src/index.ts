// ─── Database client ────────────────────────────────────────
export { createDb, createDbFromEnv, destroyDb } from './db.js';
export type { DbConfig, FireDataDb } from './db.js';

// ─── Schema types ───────────────────────────────────────────
export type {
  Database,
  // Finance
  AssetType,
  AssetTable, Asset, NewAsset, AssetUpdate,
  AssetPriceSnapshotTable, AssetPriceSnapshot, NewAssetPriceSnapshot,
  AssetFundamentalTable, AssetFundamental, NewAssetFundamental,
  // News
  NewsArticleTable, NewsArticle, NewNewsArticle,
  NewsTagTable, NewsTag, NewNewsTag,
  NewsArticleTagTable,
  // Sports
  SportTable, Sport,
  LeagueTable, League, NewLeague,
  TeamTable, Team, NewTeam,
  PlayerTable, Player, NewPlayer,
  GameStatus,
  GameTable, Game, NewGame, GameUpdate,
  // Betting
  BookmakerTable, Bookmaker, NewBookmaker,
  MarketTable, Market, NewMarket,
  OddsSnapshotTable, OddsSnapshot, NewOddsSnapshot,
} from './schema.js';

// ─── Query helpers ──────────────────────────────────────────
export * from './queries/index.js';
