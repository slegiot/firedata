import Fastify from 'fastify';
import type { HealthResponse } from '@firedata/shared-types';
import { createDbFromEnv, destroyDb } from '@firedata/shared-db';
import { FirecrawlClient } from '@firedata/shared-firecrawl-client';
import { registerRoutes } from './routes.js';
import { seedSports } from './seed/sports.js';
import { seedLeagues } from './seed/leagues.js';
import { AdapterRegistry, LEAGUE_CONFIGS } from './adapters/index.js';
import { startScheduler, stopScheduler } from './worker/index.js';

const SERVICE_NAME = 'sports-service';
const PORT = Number(process.env.PORT || process.env.SPORTS_SERVICE_PORT) || 3002;
const INGESTION_INTERVAL = Number(process.env.INGESTION_INTERVAL_MS) || 300_000;
const startTime = Date.now();

const app = Fastify({ logger: true });

// ── Health check ──────────────────────────────────────────────

app.get<{ Reply: HealthResponse }>('/health', async (_req, reply) => {
  return reply.send({
    status: 'ok',
    service: SERVICE_NAME,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
  });
});

// ── Bootstrap ─────────────────────────────────────────────────

async function start() {
  try {
    const db = createDbFromEnv();
    const firecrawl = FirecrawlClient.fromEnv();

    // Seed sports and leagues (idempotent)
    app.log.info('Running seed data...');
    await seedSports(db);
    await seedLeagues(db);

    // Create adapter registry
    const registry = new AdapterRegistry(firecrawl);

    // Mount REST routes
    await registerRoutes(app, db);

    // Start ingestion scheduler
    startScheduler(db, registry, LEAGUE_CONFIGS, INGESTION_INTERVAL);

    // Start HTTP server
    await app.listen({ port: PORT, host: '0.0.0.0' });
    app.log.info(`${SERVICE_NAME} listening on port ${PORT}`);

    // Graceful shutdown
    const shutdown = async () => {
      app.log.info('Shutting down...');
      stopScheduler();
      await app.close();
      await destroyDb();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
