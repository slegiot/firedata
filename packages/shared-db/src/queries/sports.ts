/**
 * Sports query helpers.
 */
import type { FireDataDb } from '../db.js';
import type { NewLeague, NewTeam, NewGame, GameUpdate, GameStatus } from '../schema.js';

/** Get a sport by its key (e.g. 'soccer', 'cricket'). */
export async function getSportByKey(db: FireDataDb, key: string) {
  return db
    .selectFrom('sports')
    .selectAll()
    .where('key', '=', key)
    .executeTakeFirst();
}

/** List all supported sports. */
export async function getAllSports(db: FireDataDb) {
  return db.selectFrom('sports').selectAll().orderBy('name').execute();
}

/** Upsert a league by (sport_id, name, country). */
export async function upsertLeague(db: FireDataDb, league: NewLeague) {
  return db
    .insertInto('leagues')
    .values(league)
    .onConflict((oc) =>
      oc.columns(['sport_id', 'name', 'country']).doUpdateSet({
        level: league.level,
        external_ids: league.external_ids,
      }),
    )
    .returningAll()
    .executeTakeFirstOrThrow();
}

/** Upsert a team by (league_id, name). */
export async function upsertTeam(db: FireDataDb, team: NewTeam) {
  return db
    .insertInto('teams')
    .values(team)
    .onConflict((oc) =>
      oc.columns(['league_id', 'name']).doUpdateSet({
        short_name: team.short_name,
        external_ids: team.external_ids,
      }),
    )
    .returningAll()
    .executeTakeFirstOrThrow();
}

/** Insert a new game. */
export async function insertGame(db: FireDataDb, game: NewGame) {
  return db
    .insertInto('games')
    .values(game)
    .returningAll()
    .executeTakeFirstOrThrow();
}

/** Update a game (e.g. live score, status change). */
export async function updateGame(db: FireDataDb, gameId: string, update: GameUpdate) {
  return db
    .updateTable('games')
    .set(update)
    .where('id', '=', gameId)
    .returningAll()
    .executeTakeFirstOrThrow();
}

/** Get upcoming games for a sport, ordered by start time. */
export async function getUpcomingGames(
  db: FireDataDb,
  sportKey: string,
  limit = 50,
) {
  return db
    .selectFrom('games')
    .innerJoin('leagues', 'leagues.id', 'games.league_id')
    .innerJoin('sports', 'sports.id', 'leagues.sport_id')
    .selectAll('games')
    .select(['leagues.name as league_name', 'sports.key as sport_key'])
    .where('sports.key', '=', sportKey)
    .where('games.status', '=', 'scheduled')
    .where('games.start_time', '>', new Date())
    .orderBy('games.start_time', 'asc')
    .limit(limit)
    .execute();
}

/** Get live games across all sports. */
export async function getLiveGames(db: FireDataDb) {
  return db
    .selectFrom('games')
    .innerJoin('leagues', 'leagues.id', 'games.league_id')
    .innerJoin('sports', 'sports.id', 'leagues.sport_id')
    .selectAll('games')
    .select(['leagues.name as league_name', 'sports.key as sport_key'])
    .where('games.status', '=', 'live' as GameStatus)
    .orderBy('games.start_time', 'asc')
    .execute();
}

/** Get games by league within a date range. */
export async function getGamesByLeague(
  db: FireDataDb,
  leagueId: string,
  from: Date,
  to: Date,
) {
  return db
    .selectFrom('games')
    .selectAll()
    .where('league_id', '=', leagueId)
    .where('start_time', '>=', from)
    .where('start_time', '<=', to)
    .orderBy('start_time', 'asc')
    .execute();
}
