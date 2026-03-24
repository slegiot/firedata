import Fastify from 'fastify';
import type { HealthResponse } from '@firedata/shared-types';
import { createDbFromEnv, destroyDb } from '@firedata/shared-db';
import { FirecrawlClient } from '@firedata/shared-firecrawl-client';
import { registerRoutes } from './routes.js';
import { SourceRegistry, YahooFinanceSource, GoogleFinanceSource } from './sources/index.js';
import { startScheduler, stopScheduler } from './worker/index.js';

const SERVICE_NAME = 'finance-service';
const PORT = Number(process.env.FINANCE_SERVICE_PORT) || 3001;
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

    // Register price sources
    const registry = new SourceRegistry();
    registry.register(new YahooFinanceSource(firecrawl));
    registry.register(new GoogleFinanceSource(firecrawl));

    app.log.info(
      `Registered ${registry.getSourceNames().length} price sources: ${registry.getSourceNames().join(', ')}`,
    );

    // Mount REST routes
    await registerRoutes(app, db);

    // Start ingestion scheduler
    startScheduler(db, registry, INGESTION_INTERVAL);

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
