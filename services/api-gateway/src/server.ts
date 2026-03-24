import Fastify from 'fastify';
import type { HealthResponse } from '@firedata/shared-types';
import { createDbFromEnv, destroyDb } from '@firedata/shared-db';
import { CacheClient, RateLimiter } from '@firedata/shared-cache';
import { createAuthMiddleware, createRateLimitMiddleware } from './middleware/index.js';
import { getServiceUrls } from './proxy.js';
import {
  registerFinanceRoutes,
  registerNewsRoutes,
  registerSportsRoutes,
  registerOddsRoutes,
} from './routes.js';

const SERVICE_NAME = 'api-gateway';
const PORT = Number(process.env.PORT || process.env.API_GATEWAY_PORT) || 3000;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const startTime = Date.now();

const app = Fastify({ logger: true });

// ── Health check (no auth required) ───────────────────────────

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
    const cache = new CacheClient(REDIS_URL);
    const rateLimiter = new RateLimiter(cache.getRedis());
    const serviceUrls = getServiceUrls();

    // Auth + rate limit hooks for all /v1/* routes
    const authMiddleware = createAuthMiddleware(db);
    const rateLimitMw = createRateLimitMiddleware(rateLimiter);

    app.addHook('onRequest', async (request, reply) => {
      // Skip auth for health/non-v1 routes
      if (!request.url.startsWith('/v1/')) return;

      await authMiddleware(request, reply);
      if (reply.sent) return;

      await rateLimitMw(request, reply);
    });

    // Mount route modules
    await registerFinanceRoutes(app, serviceUrls);
    await registerNewsRoutes(app, serviceUrls);
    await registerSportsRoutes(app, serviceUrls);
    await registerOddsRoutes(app, serviceUrls);

    // Start HTTP server
    await app.listen({ port: PORT, host: '0.0.0.0' });
    app.log.info(`${SERVICE_NAME} listening on port ${PORT}`);
    app.log.info(`Service URLs: ${JSON.stringify(serviceUrls)}`);

    // Graceful shutdown
    const shutdown = async () => {
      app.log.info('Shutting down...');
      await app.close();
      await cache.disconnect();
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
