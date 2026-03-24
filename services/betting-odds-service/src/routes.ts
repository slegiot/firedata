/**
 * Betting odds REST API routes.
 *
 * - GET /v1/odds/bookmakers          — list all bookmakers
 * - GET /v1/odds/bookmakers/:id/markets — markets for a bookmaker's game
 * - GET /v1/odds/games/:game_id      — latest odds for a game
 */
import type { FastifyInstance } from 'fastify';
import type { FireDataDb } from '@firedata/shared-db';

export async function registerRoutes(
  app: FastifyInstance,
  db: FireDataDb,
): Promise<void> {
  // ── GET /v1/odds/bookmakers ──────────────────────────────

  app.get('/v1/odds/bookmakers', async (_request, reply) => {
    const bookmakers = await db
      .selectFrom('bookmakers')
      .selectAll()
      .orderBy('external_rank', 'asc')
      .execute();

    return reply.send({ data: bookmakers, count: bookmakers.length });
  });

  // ── GET /v1/odds/bookmakers/:id/markets ──────────────────

  app.get<{
    Params: { id: string };
    Querystring: { game_id?: string };
  }>('/v1/odds/bookmakers/:id/markets', async (request, reply) => {
    const { id: bookmakerId } = request.params;
    const { game_id } = request.query;

    // Verify bookmaker exists
    const bookmaker = await db
      .selectFrom('bookmakers')
      .selectAll()
      .where('id', '=', bookmakerId)
      .executeTakeFirst();

    if (!bookmaker) {
      return reply.status(404).send({ error: 'Bookmaker not found' });
    }

    if (game_id) {
      // Get odds snapshots for this bookmaker + game, grouped by market
      const snapshots = await db
        .selectFrom('odds_snapshots')
        .innerJoin('markets', 'markets.id', 'odds_snapshots.market_id')
        .distinctOn('odds_snapshots.market_id')
        .select([
          'odds_snapshots.id',
          'odds_snapshots.market_id',
          'odds_snapshots.captured_at',
          'odds_snapshots.odds',
          'markets.key as market_key',
          'markets.name as market_name',
        ])
        .where('odds_snapshots.bookmaker_id', '=', bookmakerId)
        .where('odds_snapshots.game_id', '=', game_id)
        .orderBy('odds_snapshots.market_id')
        .orderBy('odds_snapshots.captured_at', 'desc')
        .execute();

      return reply.send({
        data: {
          bookmaker,
          game_id,
          markets: snapshots,
        },
      });
    }

    // Without game_id, return all markets this bookmaker has odds for
    const marketIds = await db
      .selectFrom('odds_snapshots')
      .select('market_id')
      .distinct()
      .where('bookmaker_id', '=', bookmakerId)
      .execute();

    const markets =
      marketIds.length > 0
        ? await db
            .selectFrom('markets')
            .selectAll()
            .where(
              'id',
              'in',
              marketIds.map((m) => m.market_id),
            )
            .orderBy('key')
            .execute()
        : [];

    return reply.send({
      data: { bookmaker, markets },
    });
  });

  // ── GET /v1/odds/games/:game_id ──────────────────────────

  app.get<{
    Params: { game_id: string };
    Querystring: { market?: string };
  }>('/v1/odds/games/:game_id', async (request, reply) => {
    const { game_id } = request.params;
    const { market: marketKey } = request.query;

    // Get latest odds per bookmaker+market
    let query = db
      .selectFrom('odds_snapshots')
      .innerJoin('bookmakers', 'bookmakers.id', 'odds_snapshots.bookmaker_id')
      .innerJoin('markets', 'markets.id', 'odds_snapshots.market_id')
      .distinctOn(['odds_snapshots.bookmaker_id', 'odds_snapshots.market_id'])
      .select([
        'odds_snapshots.id',
        'odds_snapshots.bookmaker_id',
        'odds_snapshots.market_id',
        'odds_snapshots.captured_at',
        'odds_snapshots.odds',
        'bookmakers.name as bookmaker_name',
        'bookmakers.external_rank',
        'markets.key as market_key',
        'markets.name as market_name',
      ])
      .where('odds_snapshots.game_id', '=', game_id)
      .orderBy('odds_snapshots.bookmaker_id')
      .orderBy('odds_snapshots.market_id')
      .orderBy('odds_snapshots.captured_at', 'desc');

    if (marketKey) {
      query = query.where('markets.key', '=', marketKey);
    }

    const odds = await query.execute();

    return reply.send({
      data: {
        game_id,
        odds,
        count: odds.length,
      },
    });
  });
}
