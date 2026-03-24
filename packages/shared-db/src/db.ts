import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import type { Database } from './schema.js';

export type FireDataDb = Kysely<Database>;

let instance: FireDataDb | null = null;

export interface DbConfig {
  connectionString: string;
  /** Maximum pool connections. @default 10 */
  max?: number;
}

/**
 * Create or return the singleton Kysely database instance.
 *
 * Uses the `pg` Pool under the hood for connection pooling.
 */
export function createDb(config: DbConfig): FireDataDb {
  if (!instance) {
    instance = new Kysely<Database>({
      dialect: new PostgresDialect({
        pool: new Pool({
          connectionString: config.connectionString,
          max: config.max ?? 10,
        }),
      }),
    });
  }
  return instance;
}

/**
 * Create a DB instance from the DATABASE_URL environment variable.
 */
export function createDbFromEnv(): FireDataDb {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  return createDb({ connectionString: url });
}

/**
 * Destroy the database connection pool.
 */
export async function destroyDb(): Promise<void> {
  if (instance) {
    await instance.destroy();
    instance = null;
  }
}
