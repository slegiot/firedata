/**
 * Sports REST API routes.
 *
 * - GET /v1/sports/sports           — list all 10 sports
 * - GET /v1/sports/leagues          — leagues by sport_key
 * - GET /v1/sports/leagues/:id/games — games by league + status filter
 * - GET /v1/sports/games/:id        — single game detail
 */
import type { FastifyInstance } from 'fastify';
import type { FireDataDb, GameStatus } from '@firedata/shared-db';

export async function registerRoutes(
  app: FastifyInstance,
  db: FireDataDb,
): Promise<void> {
  // ── GET /v1/sports/sports ────────────────────────────────

  app.get('/v1/sports/sports', async (_request, reply) => {
    const sports = await db
      .selectFrom('sports')
      .selectAll()
      .orderBy('name')
      .execute();

    return reply.send({ data: sports, count: sports.length });
  });

  // ── GET /v1/sports/leagues ───────────────────────────────

  app.get<{
    Querystring: { sport_key?: string };
  }>('/v1/sports/leagues', async (request, reply) => {
    const { sport_key } = request.query;

    let query = db
      .selectFrom('leagues')
      .innerJoin('sports', 'sports.id', 'leagues.sport_id')
      .select([
        'leagues.id',
        'leagues.name',
        'leagues.country',
        'leagues.level',
        'leagues.external_ids',
        'leagues.created_at',
        'sports.key as sport_key',
        'sports.name as sport_name',
      ])
      .orderBy('sports.name')
      .orderBy('leagues.level')
      .orderBy('leagues.name');

    if (sport_key) {
      query = query.where('sports.key', '=', sport_key);
    }

    const leagues = await query.execute();

    return reply.send({ data: leagues, count: leagues.length });
  });

  // ── GET /v1/sports/leagues/:league_id/games ──────────────

  app.get<{
    Params: { league_id: string };
    Querystring: { status?: string; limit?: string };
  }>('/v1/sports/leagues/:league_id/games', async (request, reply) => {
    const { league_id } = request.params;
    const { status, limit: limitStr } = request.query;
    const limit = Math.min(Number(limitStr) || 50, 200);

    // Verify league exists
    const league = await db
      .selectFrom('leagues')
      .selectAll()
      .where('id', '=', league_id)
      .executeTakeFirst();

    if (!league) {
      return reply.status(404).send({ error: 'League not found' });
    }

    let query = db
      .selectFrom('games')
      .leftJoin('teams as home', 'home.id', 'games.home_team_id')
      .leftJoin('teams as away', 'away.id', 'games.away_team_id')
      .select([
        'games.id',
        'games.league_id',
        'games.start_time',
        'games.status',
        'games.score',
        'games.metadata',
        'games.created_at',
        'games.updated_at',
        'home.name as home_team',
        'home.short_name as home_team_short',
        'away.name as away_team',
        'away.short_name as away_team_short',
      ])
      .where('games.league_id', '=', league_id)
      .orderBy('games.start_time', 'desc')
      .limit(limit);

    if (status) {
      // Map user-friendly names to DB status values
      const statusMap: Record<string, GameStatus> = {
        upcoming: 'scheduled',
        scheduled: 'scheduled',
        live: 'live',
        finished: 'completed',
        completed: 'completed',
        postponed: 'postponed',
        cancelled: 'cancelled',
      };
      const dbStatus = statusMap[status.toLowerCase()];
      if (dbStatus) {
        query = query.where('games.status', '=', dbStatus);
        // Sort upcoming/scheduled ascending by start time
        if (dbStatus === 'scheduled') {
          query = query.orderBy('games.start_time', 'asc');
        }
      }
    }

    const games = await query.execute();

    return reply.send({ data: games, count: games.length });
  });

  // ── GET /v1/sports/games/:id ─────────────────────────────

  app.get<{
    Params: { id: string };
  }>('/v1/sports/games/:id', async (request, reply) => {
    const { id } = request.params;

    const game = await db
      .selectFrom('games')
      .leftJoin('teams as home', 'home.id', 'games.home_team_id')
      .leftJoin('teams as away', 'away.id', 'games.away_team_id')
      .innerJoin('leagues', 'leagues.id', 'games.league_id')
      .innerJoin('sports', 'sports.id', 'leagues.sport_id')
      .select([
        'games.id',
        'games.league_id',
        'games.start_time',
        'games.status',
        'games.score',
        'games.metadata',
        'games.created_at',
        'games.updated_at',
        'home.name as home_team',
        'home.short_name as home_team_short',
        'away.name as away_team',
        'away.short_name as away_team_short',
        'leagues.name as league_name',
        'sports.key as sport_key',
        'sports.name as sport_name',
      ])
      .where('games.id', '=', id)
      .executeTakeFirst();

    if (!game) {
      return reply.status(404).send({ error: 'Game not found' });
    }

    return reply.send({ data: game });
  });
}
