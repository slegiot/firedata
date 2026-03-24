/**
 * Gateway route modules.
 *
 * Each function registers routes that proxy to the corresponding
 * internal service and wrap responses in the standard envelope.
 */
import type { FastifyInstance } from 'fastify';
import { proxyGet, type ServiceConfig } from './proxy.js';
import { wrapResponse } from './envelope.js';

// ── Shared Schema Helpers ─────────────────────────────────────

const error429 = {
  description: 'Rate Limit Exceeded',
  type: 'object',
  properties: {
    error: { type: 'string' },
    retry_after: { type: 'number' }
  }
};

const error502 = {
  description: 'Bad Gateway (Upstream Error)',
  type: 'object',
  properties: {
    error: { type: 'string' },
    details: { type: 'string' }
  }
};

const envelopeSchema = (dataSchema: any) => ({
  type: 'object',
  properties: {
    data: dataSchema,
    meta: {
      type: 'object',
      properties: {
        source: { type: 'string' },
        cached: { type: 'boolean' },
        fetched_at: { type: 'string', format: 'date-time' }
      }
    }
  }
});

const security = [{ apiKey: [] }];

// ── Finance Routes ────────────────────────────────────────────

export async function registerFinanceRoutes(
  app: FastifyInstance,
  urls: ServiceConfig,
): Promise<void> {
  app.get<{
    Querystring: { symbol?: string; asset_type?: string };
  }>('/v1/finance/assets', {
    schema: {
      description: 'List supported financial assets',
      tags: ['Finance'],
      security,
      querystring: {
        type: 'object',
        properties: {
          symbol: { type: 'string', description: 'Filter by symbol (e.g. AAPL, BTC)' },
          asset_type: { type: 'string', description: 'Filter by type (equity, crypto)' }
        }
      },
      response: {
        200: envelopeSchema({
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              symbol: { type: 'string' },
              name: { type: 'string' },
              asset_type: { type: 'string' }
            }
          }
        }),
        429: error429,
        502: error502
      }
    }
  }, async (request, reply) => {
    const res = await proxyGet(urls.finance, '/v1/finance/assets', {
      symbol: request.query.symbol,
      asset_type: request.query.asset_type,
    });
    return reply.status(res.status).send(wrapResponse(res.data, 'finance-service', res.cached));
  });

  app.get<{
    Querystring: { symbol?: string; asset_id?: string };
  }>('/v1/finance/prices/latest', {
    schema: {
      description: 'Get the latest price snapshot for assets',
      tags: ['Finance'],
      security,
      querystring: {
        type: 'object',
        properties: {
          symbol: { type: 'string', description: 'Comma separated symbols' },
          asset_id: { type: 'string', description: 'Comma separated internal IDs' }
        }
      },
      response: {
        200: envelopeSchema({
          type: 'array',
          items: {
            type: 'object',
            properties: {
              asset_id: { type: 'string' },
              price: { type: 'number' },
              currency: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' },
              open_24h: { type: 'number' },
              volume_24h: { type: 'number' }
            }
          }
        }),
        429: error429,
        502: error502
      }
    }
  }, async (request, reply) => {
    const res = await proxyGet(urls.finance, '/v1/finance/prices/latest', {
      symbol: request.query.symbol,
      asset_id: request.query.asset_id,
    });
    return reply.status(res.status).send(wrapResponse(res.data, 'finance-service', res.cached));
  });

  app.get<{
    Querystring: { symbol?: string; asset_id?: string; from?: string; to?: string };
  }>('/v1/finance/prices/history', {
    schema: {
      description: 'Get historical prices for an asset',
      tags: ['Finance'],
      security,
      querystring: {
        type: 'object',
        properties: {
          symbol: { type: 'string' },
          asset_id: { type: 'string' },
          from: { type: 'string', format: 'date-time' },
          to: { type: 'string', format: 'date-time' }
        }
      },
      response: {
        200: envelopeSchema({
          type: 'array',
          items: {
            type: 'object',
            properties: {
              price: { type: 'number' },
              timestamp: { type: 'string', format: 'date-time' }
            }
          }
        })
      }
    }
  }, async (request, reply) => {
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
  }>('/v1/news', {
    schema: {
      description: 'List latest news articles',
      tags: ['News'],
      security,
      querystring: {
        type: 'object',
        properties: {
          category: { type: 'string' },
          limit: { type: 'number' },
          cursor: { type: 'string' }
        }
      },
      response: {
        200: envelopeSchema({
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              url: { type: 'string' },
              published_at: { type: 'string', format: 'date-time' },
              summary: { type: 'string' },
              source: { type: 'string' },
              tags: { type: 'array', items: { type: 'string' } }
            }
          }
        })
      }
    }
  }, async (request, reply) => {
    const res = await proxyGet(urls.news, '/v1/news', {
      category: request.query.category,
      limit: request.query.limit,
      cursor: request.query.cursor,
    });
    return reply.status(res.status).send(wrapResponse(res.data, 'news-service', res.cached));
  });

  app.get<{
    Params: { id: string };
  }>('/v1/news/:id', {
    schema: {
      description: 'Get a specific news article by ID',
      tags: ['News'],
      security,
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        200: envelopeSchema({
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            url: { type: 'string' },
            published_at: { type: 'string', format: 'date-time' },
            summary: { type: 'string' },
            source: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } }
          }
        })
      }
    }
  }, async (request, reply) => {
    const res = await proxyGet(urls.news, `/v1/news/${request.params.id}`);
    return reply.status(res.status).send(wrapResponse(res.data, 'news-service', res.cached));
  });
}

// ── Sports Routes ─────────────────────────────────────────────

export async function registerSportsRoutes(
  app: FastifyInstance,
  urls: ServiceConfig,
): Promise<void> {
  app.get('/v1/sports/sports', {
    schema: {
      description: 'List all supported sports',
      tags: ['Sports'],
      security,
      response: {
        200: envelopeSchema({
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              key: { type: 'string' },
              name: { type: 'string' }
            }
          }
        })
      }
    }
  }, async (_request, reply) => {
    const res = await proxyGet(urls.sports, '/v1/sports/sports');
    return reply.status(res.status).send(wrapResponse(res.data, 'sports-service', res.cached));
  });

  app.get<{
    Querystring: { sport_key?: string };
  }>('/v1/sports/leagues', {
    schema: {
      description: 'List supported leagues',
      tags: ['Sports'],
      security,
      querystring: {
        type: 'object',
        properties: {
          sport_key: { type: 'string' }
        }
      },
      response: {
        200: envelopeSchema({
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              sport_id: { type: 'string' },
              key: { type: 'string' },
              name: { type: 'string' },
              country: { type: 'string' }
            }
          }
        })
      }
    }
  }, async (request, reply) => {
    const res = await proxyGet(urls.sports, '/v1/sports/leagues', {
      sport_key: request.query.sport_key,
    });
    return reply.status(res.status).send(wrapResponse(res.data, 'sports-service', res.cached));
  });

  app.get<{
    Querystring: { league_id?: string; status?: string; limit?: string };
  }>('/v1/sports/games', {
    schema: {
      description: 'List sports games',
      tags: ['Sports'],
      security,
      querystring: {
        type: 'object',
        properties: {
          league_id: { type: 'string' },
          status: { type: 'string', enum: ['upcoming', 'live', 'finished'] },
          limit: { type: 'number' }
        }
      },
      response: {
        200: envelopeSchema({
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              league_id: { type: 'string' },
              home_team_id: { type: 'string' },
              away_team_id: { type: 'string' },
              start_time: { type: 'string', format: 'date-time' },
              status: { type: 'string' },
              home_score: { type: 'number' },
              away_score: { type: 'number' }
            }
          }
        })
      }
    }
  }, async (request, reply) => {
    const { league_id, status, limit } = request.query;
    const path = league_id ? `/v1/sports/leagues/${league_id}/games` : '/v1/sports/games';
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
  }>('/v1/odds/games/:game_id', {
    schema: {
      description: 'Get latest betting odds for a specific game',
      tags: ['Betting Odds'],
      security,
      params: {
        type: 'object',
        properties: {
          game_id: { type: 'string' }
        },
        required: ['game_id']
      },
      querystring: {
        type: 'object',
        properties: {
          market: { type: 'string' }
        }
      },
      response: {
        200: envelopeSchema({
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              bookmaker_id: { type: 'string' },
              market_id: { type: 'string' },
              price: { type: 'number' },
              selection: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' }
            }
          }
        })
      }
    }
  }, async (request, reply) => {
    const res = await proxyGet(urls.odds, `/v1/odds/games/${request.params.game_id}`, {
      market: request.query.market,
    });
    return reply.status(res.status).send(wrapResponse(res.data, 'betting-odds-service', res.cached));
  });

  app.get('/v1/odds/bookmakers', {
    schema: {
      description: 'List supported bookmakers for odds',
      tags: ['Betting Odds'],
      security,
      response: {
        200: envelopeSchema({
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              url: { type: 'string' },
              country: { type: 'string' }
            }
          }
        })
      }
    }
  }, async (_request, reply) => {
    const res = await proxyGet(urls.odds, '/v1/odds/bookmakers');
    return reply.status(res.status).send(wrapResponse(res.data, 'betting-odds-service', res.cached));
  });
}
