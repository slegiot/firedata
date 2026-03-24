import Fastify from 'fastify';
import type { HealthResponse } from '@firedata/shared-types';

const SERVICE_NAME = 'sports-service';
const PORT = Number(process.env.PORT || process.env.SPORTS_SERVICE_PORT) || 3002;
const startTime = Date.now();

const app = Fastify({ logger: true });

app.get<{ Reply: HealthResponse }>('/health', async (_req, reply) => {
  return reply.send({
    status: 'ok',
    service: SERVICE_NAME,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
  });
});

async function start() {
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    app.log.info(`${SERVICE_NAME} listening on port ${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
