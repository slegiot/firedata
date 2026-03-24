import Fastify from 'fastify';
import type { HealthResponse } from '@firedata/shared-types';
import { createDbFromEnv, destroyDb } from '@firedata/shared-db';
import { FirecrawlClient } from '@firedata/shared-firecrawl-client';
import { createLogger, createServiceMetrics, instrumentFastify } from '@firedata/shared-logging';
import { registerRoutes } from './routes.js';
import { SourceRegistry, YahooFinanceSource, GoogleFinanceSource } from './sources/index.js';
import { startScheduler, stopScheduler } from './worker/index.js';

const SERVICE_NAME = 'finance-service';
const PORT = Number(process.env.PORT || process.env.FINANCE_SERVICE_PORT) || 3001;
const INGESTION_INTERVAL = Number(process.env.INGESTION_INTERVAL_MS) || 300_000;
const startTime = Date.now();

const logger = createLogger({ service: SERVICE_NAME });
const metrics = createServiceMetrics(SERVICE_NAME);

const app = Fastify({ logger: false });

// Attach observability (correlation IDs, metrics, /metrics endpoint)
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

    // Register price sources
    const registry = new SourceRegistry();
    registry.register(new YahooFinanceSource(firecrawl));
    registry.register(new GoogleFinanceSource(firecrawl));

    logger.info(
      `Registered ${registry.getSourceNames().length} price sources: ${registry.getSourceNames().join(', ')}`,
    );

    // Mount REST routes
    await registerRoutes(app, db);

    // Start ingestion scheduler
    startScheduler(db, registry, INGESTION_INTERVAL);

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
