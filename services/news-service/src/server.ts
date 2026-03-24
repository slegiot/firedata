import Fastify from 'fastify';
import type { HealthResponse } from '@firedata/shared-types';
import { createDbFromEnv, destroyDb } from '@firedata/shared-db';
import { FirecrawlClient } from '@firedata/shared-firecrawl-client';
import { registerRoutes } from './routes.js';
import { NewsSourceRegistry, DEFAULT_SOURCES } from './sources/index.js';
import { startScheduler, stopScheduler } from './worker/index.js';

const SERVICE_NAME = 'news-service';
const PORT = Number(process.env.PORT || process.env.NEWS_SERVICE_PORT) || 3003;
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
    // Initialise database
    const db = createDbFromEnv();

    // Initialise Firecrawl client
    const firecrawl = FirecrawlClient.fromEnv();

    // Create source registry
    const registry = new NewsSourceRegistry(firecrawl);

    app.log.info(
      `Configured ${DEFAULT_SOURCES.filter((s) => s.enabled).length} news sources`,
    );

    // Mount REST routes
    await registerRoutes(app, db);

    // Start ingestion scheduler
    startScheduler(db, registry, DEFAULT_SOURCES, INGESTION_INTERVAL);

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
