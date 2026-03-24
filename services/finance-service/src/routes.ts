/**
 * Finance REST API routes.
 *
 * - GET /v1/finance/assets?symbol=XYZ&type=equity
 * - GET /v1/finance/assets/:id/prices/latest
 * - GET /v1/finance/assets/:id/prices/history?from=...&to=...
 */
import type { FastifyInstance } from 'fastify';
import type { FireDataDb } from '@firedata/shared-db';
import { getLatestAssetPrice, upsertAsset } from '@firedata/shared-db';

export async function registerRoutes(
  app: FastifyInstance,
  db: FireDataDb,
): Promise<void> {
  // ── GET /v1/finance/assets ────────────────────────────────

  app.get<{
    Querystring: { symbol?: string; type?: string };
  }>('/v1/finance/assets', async (request, reply) => {
    const { symbol, type } = request.query;

    let query = db.selectFrom('assets').selectAll();

    if (symbol) {
      query = query.where('symbol', 'ilike', `%${symbol}%`);
    }
    if (type && ['equity', 'etf', 'crypto'].includes(type)) {
      query = query.where('asset_type', '=', type as 'equity' | 'etf' | 'crypto');
    }

    const assets = await query.orderBy('symbol').limit(100).execute();

    return reply.send({ data: assets, count: assets.length });
  });

  // ── GET /v1/finance/assets/:id/prices/latest ──────────────

  app.get<{
    Params: { id: string };
  }>('/v1/finance/assets/:id/prices/latest', async (request, reply) => {
    const { id } = request.params;

    // Verify asset exists
    const asset = await db
      .selectFrom('assets')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!asset) {
      return reply.status(404).send({ error: 'Asset not found' });
    }

    const snapshot = await getLatestAssetPrice(db, id);

    if (!snapshot) {
      return reply.status(404).send({
        error: 'No price data available for this asset',
        asset,
      });
    }

    return reply.send({ data: { asset, price: snapshot } });
  });

  // ── GET /v1/finance/assets/:id/prices/history ─────────────

  app.get<{
    Params: { id: string };
    Querystring: { from?: string; to?: string; source?: string; limit?: string };
  }>('/v1/finance/assets/:id/prices/history', async (request, reply) => {
    const { id } = request.params;
    const {
      from,
      to,
      source,
      limit: limitStr,
    } = request.query;

    // Verify asset exists
    const asset = await db
      .selectFrom('assets')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!asset) {
      return reply.status(404).send({ error: 'Asset not found' });
    }

    let query = db
      .selectFrom('asset_price_snapshots')
      .selectAll()
      .where('asset_id', '=', id);

    if (from) {
      query = query.where('timestamp', '>=', new Date(from));
    }
    if (to) {
      query = query.where('timestamp', '<=', new Date(to));
    }
    if (source) {
      query = query.where('source', '=', source);
    }

    const limit = Math.min(Number(limitStr) || 500, 1000);

    const snapshots = await query
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .execute();

    return reply.send({
      data: { asset, prices: snapshots },
      count: snapshots.length,
    });
  });

  // ── POST /v1/finance/assets — track a new asset ───────────

  app.post<{
    Body: {
      symbol: string;
      asset_type: 'equity' | 'etf' | 'crypto';
      name: string;
      exchange?: string;
      metadata?: Record<string, unknown>;
    };
  }>('/v1/finance/assets', async (request, reply) => {
    const { symbol, asset_type, name, exchange, metadata } = request.body;

    if (!symbol || !asset_type || !name) {
      return reply.status(400).send({
        error: 'symbol, asset_type, and name are required',
      });
    }

    const asset = await upsertAsset(db, {
      symbol: symbol.toUpperCase(),
      asset_type,
      name,
      exchange: exchange ?? null,
      metadata: metadata ?? {},
    });

    return reply.status(201).send({ data: asset });
  });
}
