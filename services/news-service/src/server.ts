import Fastify from 'fastify';
import type { HealthResponse } from '@firedata/shared-types';
import { createDbFromEnv, destroyDb } from '@firedata/shared-db';
import { FirecrawlClient } from '@firedata/shared-firecrawl-client';
import { createLogger, createServiceMetrics, instrumentFastify } from '@firedata/shared-logging';
import { registerRoutes } from './routes.js';
import { NewsSourceRegistry, DEFAULT_SOURCES } from './sources/index.js';
import { startScheduler, stopScheduler } from './worker/index.js';

const SERVICE_NAME = 'news-service';
const PORT = Number(process.env.PORT || process.env.NEWS_SERVICE_PORT) || 3003;
const INGESTION_INTERVAL = Number(process.env.INGESTION_INTERVAL_MS) || 300_000;
const startTime = Date.now();

const logger = createLogger({ service: SERVICE_NAME });
const metrics = createServiceMetrics(SERVICE_NAME);

const app = Fastify({ logger: false });

instrumentFastify(app, logger, metrics);

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

    const registry = new NewsSourceRegistry(firecrawl);

    logger.info(
      `Configured ${DEFAULT_SOURCES.filter((s) => s.enabled).length} news sources`,
    );

    await registerRoutes(app, db);

    startScheduler(db, registry, DEFAULT_SOURCES, INGESTION_INTERVAL);

    await app.listen({ port: PORT, host: '0.0.0.0' });
    logger.info(`${SERVICE_NAME} listening on port ${PORT}`);

    const shutdown = async () => {
      logger.info('Shutting down...');
      stopScheduler();
      await app.close();
      await destroyDb();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    logger.error(err, 'Failed to start');
    process.exit(1);
  }
}

start();
