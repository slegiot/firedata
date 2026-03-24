/**
 * API key authentication middleware.
 *
 * Extracts API key from X-API-Key header, validates against DB,
 * records usage, and attaches key metadata to the request.
 */
import crypto from 'crypto';
import type { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';
import type { FireDataDb, ApiKey } from '@firedata/shared-db';
import { getApiKeyByHash, recordApiKeyUsage } from '@firedata/shared-db';

declare module 'fastify' {
  interface FastifyRequest {
    apiKey?: ApiKey;
  }
}

/** Hash a raw API key for lookup. */
export function hashApiKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

/** Generate a new raw API key. */
export function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const raw = `fd_live_${crypto.randomBytes(24).toString('base64url')}`;
  return {
    raw,
    hash: hashApiKey(raw),
    prefix: raw.slice(0, 10),
  };
}

export function createAuthMiddleware(db: FireDataDb) {
  return async function authMiddleware(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const apiKeyHeader = request.headers['x-api-key'];

    if (!apiKeyHeader || typeof apiKeyHeader !== 'string') {
      reply.status(401).send({
        error: 'Missing API key',
        message: 'Include a valid API key in the X-API-Key header.',
      });
      return;
    }

    const keyHash = hashApiKey(apiKeyHeader);
    const apiKey = await getApiKeyByHash(db, keyHash);

    if (!apiKey) {
      reply.status(401).send({
        error: 'Invalid API key',
        message: 'The provided API key is not valid or has been deactivated.',
      });
      return;
    }

    // Record usage (fire-and-forget, don't block the request)
    recordApiKeyUsage(db, apiKey.id).catch((err) =>
      request.log.error(err, 'Failed to record API key usage'),
    );

    // Attach to request for downstream use
    request.apiKey = apiKey;
  };
}
