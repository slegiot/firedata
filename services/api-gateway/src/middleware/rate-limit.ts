/**
 * Rate limiting middleware using shared-cache RateLimiter.
 *
 * Per-key sliding window rate limit using Redis sorted sets.
 */
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { RateLimiter } from '@firedata/shared-cache';

export function createRateLimitMiddleware(rateLimiter: RateLimiter) {
  return async function rateLimitMiddleware(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const apiKey = request.apiKey;
    if (!apiKey) return; // Auth middleware should run first

    const key = `rate:${apiKey.id}`;
    const result = await rateLimiter.check(key, apiKey.rate_limit, apiKey.rate_window_ms);

    // Set rate limit headers
    reply.header('X-RateLimit-Limit', apiKey.rate_limit);
    reply.header('X-RateLimit-Remaining', result.remaining);
    reply.header('X-RateLimit-Reset', Math.ceil(result.resetAt / 1000));

    if (!result.allowed) {
      reply.status(429).send({
        error: 'Rate limit exceeded',
        message: `You have exceeded ${apiKey.rate_limit} requests per ${apiKey.rate_window_ms / 1000}s. Retry after rate limit window resets.`,
        retry_after_ms: apiKey.rate_window_ms,
      });
      return;
    }
  };
}
