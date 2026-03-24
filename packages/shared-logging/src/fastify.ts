/**
 * Fastify integration hooks for observability.
 *
 * - Attaches correlation IDs to every request.
 * - Records HTTP request count and latency metrics.
 * - Registers a /metrics endpoint.
 */
import crypto from 'crypto';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { Logger } from './logger.js';
import type { ServiceMetrics } from './service-metrics.js';

const CORRELATION_HEADER = 'x-correlation-id';

/**
 * Add observability hooks to a Fastify instance.
 */
export function instrumentFastify(
  app: FastifyInstance,
  logger: Logger,
  metrics: ServiceMetrics,
): void {
  // ── Correlation ID + request logging ─────────────────────

  app.addHook('onRequest', async (request: FastifyRequest, _reply: FastifyReply) => {
    // Propagate or generate correlation ID
    const incomingId = request.headers[CORRELATION_HEADER];
    const correlationId =
      typeof incomingId === 'string' && incomingId
        ? incomingId
        : crypto.randomUUID();

    // Attach to request for downstream use
    (request as any).correlationId = correlationId;

    // Assign child logger with correlation ID
    request.log = logger.child({ correlationId, reqId: request.id });
  });

  // ── Response metrics + logging ───────────────────────────

  app.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    const route = request.routeOptions?.url || request.url;
    const method = request.method;
    const statusCode = String(reply.statusCode);
    const responseTime = reply.elapsedTime; // Fastify built-in

    // Record metrics
    metrics.httpRequestCount.inc({ method, route, status: statusCode });
    metrics.httpRequestDuration.observe(
      { method, route, status: statusCode },
      (responseTime || 0) / 1000,
    );

    // Set correlation ID on response
    const correlationId = (request as any).correlationId;
    if (correlationId) {
      reply.header(CORRELATION_HEADER, correlationId);
    }

    // Log request completion
    request.log.info(
      {
        method,
        url: request.url,
        statusCode: reply.statusCode,
        responseTime: Math.round(responseTime || 0),
      },
      'request completed',
    );
  });

  // ── /metrics endpoint ────────────────────────────────────

  app.get('/metrics', async (_request, reply) => {
    reply.header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    return reply.send(metrics.registry.serialize());
  });
}
