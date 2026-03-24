/**
 * Sports ingestion worker.
 *
 * Pipeline: fetch adapters → upsert teams → upsert/update games.
 */
import type { FireDataDb } from '@firedata/shared-db';
import { getSportByKey, upsertLeague, upsertTeam, insertGame, updateGame } from '@firedata/shared-db';
import type { LeagueAdapterConfig, NormalizedGame } from '../adapters/types.js';
import type { AdapterRegistry } from '../adapters/registry.js';

export interface IngestionResult {
  leagues: number;
  gamesUpserted: number;
  errors: Array<{ league: string; error: string }>;
}

export async function runSportsIngestion(
  db: FireDataDb,
  registry: AdapterRegistry,
  configs: LeagueAdapterConfig[],
): Promise<IngestionResult> {
  const result: IngestionResult = {
    leagues: 0,
    gamesUpserted: 0,
    errors: [],
  };

  console.log(`[sports-worker] Starting ingestion for ${configs.filter((c) => c.enabled).length} league configs...`);

  const gamesByLeague = await registry.fetchAll(configs);

  for (const [leagueName, games] of gamesByLeague) {
    try {
      const config = configs.find((c) => c.leagueName === leagueName);
      if (!config) continue;

      // Resolve sport and league
      const sport = await getSportByKey(db, config.sportKey);
      if (!sport) {
        result.errors.push({ league: leagueName, error: `Sport '${config.sportKey}' not found` });
        continue;
      }

      const league = await upsertLeague(db, {
        sport_id: sport.id,
        name: leagueName,
        country: null,
        level: 1,
        external_ids: {},
      });

      // Process each game
      for (const game of games) {
        try {
          // Upsert teams
          const homeTeam = await upsertTeam(db, {
            league_id: league.id,
            name: game.homeTeam,
            short_name: game.homeTeamShort,
            external_ids: {},
          });

          const awayTeam = await upsertTeam(db, {
            league_id: league.id,
            name: game.awayTeam,
            short_name: game.awayTeamShort,
            external_ids: {},
          });

          // Check if game already exists (by external_id in metadata)
          const existingGame = await db
            .selectFrom('games')
            .selectAll()
            .where('league_id', '=', league.id)
            .where('home_team_id', '=', homeTeam.id)
            .where('away_team_id', '=', awayTeam.id)
            .where('start_time', '=', game.startTime)
            .executeTakeFirst();

          if (existingGame) {
            // Update existing game
            await updateGame(db, existingGame.id, {
              status: game.status,
              score: game.score,
              metadata: { ...game.metadata, externalId: game.externalId },
            });
          } else {
            // Insert new game
            await insertGame(db, {
              league_id: league.id,
              home_team_id: homeTeam.id,
              away_team_id: awayTeam.id,
              start_time: game.startTime,
              status: game.status,
              score: game.score,
              metadata: { ...game.metadata, externalId: game.externalId },
            });
          }

          result.gamesUpserted++;
        } catch (err) {
          result.errors.push({
            league: leagueName,
            error: `Game ${game.homeTeam} vs ${game.awayTeam}: ${err instanceof Error ? err.message : String(err)}`,
          });
        }
      }

      result.leagues++;
    } catch (err) {
      result.errors.push({
        league: leagueName,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  console.log(
    `[sports-worker] Done: ${result.leagues} leagues, ${result.gamesUpserted} games, ${result.errors.length} errors`,
  );

  return result;
}
