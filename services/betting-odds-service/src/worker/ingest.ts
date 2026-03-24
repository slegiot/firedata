/**
 * Odds ingestion worker.
 *
 * Iterates tracked games (upcoming/live), fetches odds from each bookmaker,
 * and writes snapshots to odds_snapshots table.
 */
import type { FireDataDb } from '@firedata/shared-db';
import {
  getAllBookmakers,
  getMarketsBySport,
  insertOddsSnapshot,
} from '@firedata/shared-db';
import type { OddsSourceRegistry } from '../sources/registry.js';

export interface IngestionResult {
  gamesProcessed: number;
  snapshotsInserted: number;
  errors: Array<{ bookmaker: string; error: string }>;
}

/**
 * Run a single odds ingestion cycle.
 *
 * @param lookAheadHours — How far ahead to look for upcoming games.
 */
export async function runOddsIngestion(
  db: FireDataDb,
  registry: OddsSourceRegistry,
  lookAheadHours = 24,
): Promise<IngestionResult> {
  const result: IngestionResult = {
    gamesProcessed: 0,
    snapshotsInserted: 0,
    errors: [],
  };

  console.log(`[odds-worker] Starting ingestion (look-ahead: ${lookAheadHours}h)...`);

  // Get all bookmakers
  const bookmakers = await getAllBookmakers(db);
  if (bookmakers.length === 0) {
    console.log('[odds-worker] No bookmakers found.');
    return result;
  }

  // Get upcoming and live games
  const now = new Date();
  const cutoff = new Date(now.getTime() + lookAheadHours * 60 * 60 * 1000);

  const games = await db
    .selectFrom('games')
    .innerJoin('leagues', 'leagues.id', 'games.league_id')
    .selectAll('games')
    .select('leagues.sport_id')
    .where((eb) =>
      eb.or([
        eb('games.status', '=', 'live'),
        eb.and([
          eb('games.status', '=', 'scheduled'),
          eb('games.start_time', '>=', now),
          eb('games.start_time', '<=', cutoff),
        ]),
      ]),
    )
    .orderBy('games.start_time', 'asc')
    .limit(100)
    .execute();

  if (games.length === 0) {
    console.log('[odds-worker] No upcoming/live games found.');
    return result;
  }

  console.log(`[odds-worker] Processing ${games.length} games across ${bookmakers.length} bookmakers...`);

  // Cache markets per sport
  const sportMarketsCache = new Map<string, string[]>();

  for (const game of games) {
    result.gamesProcessed++;

    // Resolve market keys for this game's sport
    let marketKeys = sportMarketsCache.get(game.sport_id);
    if (!marketKeys) {
      const markets = await getMarketsBySport(db, game.sport_id);
      marketKeys = markets.map((m) => m.key);
      sportMarketsCache.set(game.sport_id, marketKeys);
    }

    if (marketKeys.length === 0) continue;

    // Fetch odds from each bookmaker
    for (const bookmaker of bookmakers) {
      try {
        const snapshot = await registry.fetchOdds(
          'soccer-odds-html', // Default to soccer adapter for now
          bookmaker,
          game,
          marketKeys,
        );

        if (!snapshot || snapshot.markets.length === 0) continue;

        // Resolve market IDs and insert snapshots
        const markets = await getMarketsBySport(db, game.sport_id);
        const marketMap = new Map(markets.map((m) => [m.key, m.id]));

        for (const marketOdds of snapshot.markets) {
          const marketId = marketMap.get(marketOdds.marketKey);
          if (!marketId) continue;

          await insertOddsSnapshot(db, {
            bookmaker_id: bookmaker.id,
            game_id: game.id,
            market_id: marketId,
            odds: marketOdds.odds,
            raw: marketOdds.raw,
          });

          result.snapshotsInserted++;
        }
      } catch (err) {
        result.errors.push({
          bookmaker: bookmaker.name,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  console.log(
    `[odds-worker] Done: ${result.gamesProcessed} games, ${result.snapshotsInserted} snapshots, ${result.errors.length} errors`,
  );

  return result;
}
