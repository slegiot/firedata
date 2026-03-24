/**
 * Gateway route modules.
 *
 * Each function registers routes that proxy to the corresponding
 * internal service and wrap responses in the standard envelope.
 */
import type { FastifyInstance } from 'fastify';
import { proxyGet, type ServiceConfig } from './proxy.js';
import { wrapResponse } from './envelope.js';

// ── Finance Routes ────────────────────────────────────────────

export async function registerFinanceRoutes(
  app: FastifyInstance,
  urls: ServiceConfig,
): Promise<void> {
  app.get<{
    Querystring: { symbol?: string; asset_type?: string };
  }>('/v1/finance/assets', async (request, reply) => {
    const res = await proxyGet(urls.finance, '/v1/finance/assets', {
      symbol: request.query.symbol,
      asset_type: request.query.asset_type,
    });
    return reply.status(res.status).send(wrapResponse(res.data, 'finance-service', res.cached));
  });

  app.get<{
    Querystring: { symbol?: string; asset_id?: string };
  }>('/v1/finance/prices/latest', async (request, reply) => {
    // Proxy to /v1/finance/assets/:id/prices/latest or similar
    const res = await proxyGet(urls.finance, '/v1/finance/prices/latest', {
      symbol: request.query.symbol,
      asset_id: request.query.asset_id,
    });
    return reply.status(res.status).send(wrapResponse(res.data, 'finance-service', res.cached));
  });

  app.get<{
    Querystring: { symbol?: string; asset_id?: string; from?: string; to?: string };
  }>('/v1/finance/prices/history', async (request, reply) => {
    const res = await proxyGet(urls.finance, '/v1/finance/prices/history', {
      symbol: request.query.symbol,
      asset_id: request.query.asset_id,
      from: request.query.from,
      to: request.query.to,
    });
    return reply.status(res.status).send(wrapResponse(res.data, 'finance-service', res.cached));
  });
}

// ── News Routes ───────────────────────────────────────────────

export async function registerNewsRoutes(
  app: FastifyInstance,
  urls: ServiceConfig,
): Promise<void> {
  app.get<{
    Querystring: { category?: string; limit?: string; cursor?: string };
  }>('/v1/news', async (request, reply) => {
    const res = await proxyGet(urls.news, '/v1/news', {
      category: request.query.category,
      limit: request.query.limit,
      cursor: request.query.cursor,
    });
    return reply.status(res.status).send(wrapResponse(res.data, 'news-service', res.cached));
  });

  app.get<{
    Params: { id: string };
  }>('/v1/news/:id', async (request, reply) => {
    const res = await proxyGet(urls.news, `/v1/news/${request.params.id}`);
    return reply.status(res.status).send(wrapResponse(res.data, 'news-service', res.cached));
  });
}

// ── Sports Routes ─────────────────────────────────────────────

export async function registerSportsRoutes(
  app: FastifyInstance,
  urls: ServiceConfig,
): Promise<void> {
  app.get('/v1/sports/sports', async (_request, reply) => {
    const res = await proxyGet(urls.sports, '/v1/sports/sports');
    return reply.status(res.status).send(wrapResponse(res.data, 'sports-service', res.cached));
  });

  app.get<{
    Querystring: { sport_key?: string };
  }>('/v1/sports/leagues', async (request, reply) => {
    const res = await proxyGet(urls.sports, '/v1/sports/leagues', {
      sport_key: request.query.sport_key,
    });
    return reply.status(res.status).send(wrapResponse(res.data, 'sports-service', res.cached));
  });

  app.get<{
    Querystring: { league_id?: string; status?: string; limit?: string };
  }>('/v1/sports/games', async (request, reply) => {
    const { league_id, status, limit } = request.query;

    // If league_id specified, route to the league-specific endpoint
    const path = league_id
      ? `/v1/sports/leagues/${league_id}/games`
      : '/v1/sports/games';

    const res = await proxyGet(urls.sports, path, { status, limit });
    return reply.status(res.status).send(wrapResponse(res.data, 'sports-service', res.cached));
  });
}

// ── Odds Routes ───────────────────────────────────────────────

export async function registerOddsRoutes(
  app: FastifyInstance,
  urls: ServiceConfig,
): Promise<void> {
  app.get<{
    Params: { game_id: string };
    Querystring: { market?: string };
  }>('/v1/odds/games/:game_id', async (request, reply) => {
    const res = await proxyGet(urls.odds, `/v1/odds/games/${request.params.game_id}`, {
      market: request.query.market,
    });
    return reply.status(res.status).send(wrapResponse(res.data, 'betting-odds-service', res.cached));
  });

  app.get('/v1/odds/bookmakers', async (_request, reply) => {
    const res = await proxyGet(urls.odds, '/v1/odds/bookmakers');
    return reply.status(res.status).send(wrapResponse(res.data, 'betting-odds-service', res.cached));
  });
}
