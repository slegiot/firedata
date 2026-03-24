/**
 * Betting odds query helpers.
 */
import type { FireDataDb } from '../db.js';
import type { NewBookmaker, NewMarket, NewOddsSnapshot } from '../schema.js';

/** Upsert a bookmaker by name. */
export async function upsertBookmaker(db: FireDataDb, bookmaker: NewBookmaker) {
  return db
    .insertInto('bookmakers')
    .values(bookmaker)
    .onConflict((oc) =>
      oc.column('name').doUpdateSet({
        country: bookmaker.country,
        url: bookmaker.url,
        external_rank: bookmaker.external_rank,
      }),
    )
    .returningAll()
    .executeTakeFirstOrThrow();
}

/** Upsert a market by (sport_id, key). */
export async function upsertMarket(db: FireDataDb, market: NewMarket) {
  return db
    .insertInto('markets')
    .values(market)
    .onConflict((oc) =>
      oc.columns(['sport_id', 'key']).doUpdateSet({
        name: market.name,
      }),
    )
    .returningAll()
    .executeTakeFirstOrThrow();
}

/** Insert an odds snapshot. */
export async function insertOddsSnapshot(db: FireDataDb, snapshot: NewOddsSnapshot) {
  return db
    .insertInto('odds_snapshots')
    .values(snapshot)
    .returningAll()
    .executeTakeFirstOrThrow();
}

/** Bulk insert odds snapshots. */
export async function insertOddsSnapshots(db: FireDataDb, snapshots: NewOddsSnapshot[]) {
  if (snapshots.length === 0) return [];

  return db
    .insertInto('odds_snapshots')
    .values(snapshots)
    .returningAll()
    .execute();
}

/** Get the latest odds for a game across all bookmakers and markets. */
export async function getLatestOddsForGame(db: FireDataDb, gameId: string) {
  // Use DISTINCT ON to get the most recent snapshot per (bookmaker, market) pair
  return db
    .selectFrom('odds_snapshots')
    .innerJoin('bookmakers', 'bookmakers.id', 'odds_snapshots.bookmaker_id')
    .innerJoin('markets', 'markets.id', 'odds_snapshots.market_id')
    .distinctOn(['odds_snapshots.bookmaker_id', 'odds_snapshots.market_id'])
    .select([
      'odds_snapshots.id',
      'odds_snapshots.bookmaker_id',
      'odds_snapshots.game_id',
      'odds_snapshots.market_id',
      'odds_snapshots.captured_at',
      'odds_snapshots.odds',
      'bookmakers.name as bookmaker_name',
      'markets.key as market_key',
      'markets.name as market_name',
    ])
    .where('odds_snapshots.game_id', '=', gameId)
    .orderBy('odds_snapshots.bookmaker_id')
    .orderBy('odds_snapshots.market_id')
    .orderBy('odds_snapshots.captured_at', 'desc')
    .execute();
}

/** Get odds history for a specific game + bookmaker + market combo. */
export async function getOddsHistory(
  db: FireDataDb,
  gameId: string,
  bookmakerId: string,
  marketId: string,
  limit = 100,
) {
  return db
    .selectFrom('odds_snapshots')
    .selectAll()
    .where('game_id', '=', gameId)
    .where('bookmaker_id', '=', bookmakerId)
    .where('market_id', '=', marketId)
    .orderBy('captured_at', 'desc')
    .limit(limit)
    .execute();
}

/** Get all bookmakers, ranked by external_rank. */
export async function getAllBookmakers(db: FireDataDb) {
  return db
    .selectFrom('bookmakers')
    .selectAll()
    .orderBy('external_rank', 'asc')
    .execute();
}

/** Get all markets for a sport. */
export async function getMarketsBySport(db: FireDataDb, sportId: string) {
  return db
    .selectFrom('markets')
    .selectAll()
    .where('sport_id', '=', sportId)
    .orderBy('key')
    .execute();
}
