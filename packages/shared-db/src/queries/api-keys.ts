/**
 * API key query helpers.
 */
import type { FireDataDb } from '../db.js';
import type { NewApiKey, ApiKeyUpdate } from '../schema.js';

/** Look up an API key by its hash. */
export async function getApiKeyByHash(db: FireDataDb, keyHash: string) {
  return db
    .selectFrom('api_keys')
    .selectAll()
    .where('key_hash', '=', keyHash)
    .where('is_active', '=', true)
    .executeTakeFirst();
}

/** Create a new API key. */
export async function createApiKey(db: FireDataDb, apiKey: NewApiKey) {
  return db
    .insertInto('api_keys')
    .values(apiKey)
    .returningAll()
    .executeTakeFirstOrThrow();
}

/** Increment usage count and set last_used_at. */
export async function recordApiKeyUsage(db: FireDataDb, keyId: string) {
  return db
    .updateTable('api_keys')
    .set((eb) => ({
      usage_count: eb('usage_count', '+', 1),
      last_used_at: new Date(),
    }))
    .where('id', '=', keyId)
    .execute();
}

/** Deactivate an API key. */
export async function deactivateApiKey(db: FireDataDb, keyId: string) {
  return db
    .updateTable('api_keys')
    .set({ is_active: false })
    .where('id', '=', keyId)
    .execute();
}

/** List all API keys (admin). */
export async function listApiKeys(db: FireDataDb) {
  return db
    .selectFrom('api_keys')
    .selectAll()
    .orderBy('created_at', 'desc')
    .execute();
}
