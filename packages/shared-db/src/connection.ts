import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

let pool: Pool | null = null;

export interface DbConfig {
  connectionString: string;
  max?: number;
}

export function createPool(config: DbConfig): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: config.connectionString,
      max: config.max ?? 10,
    });
  }
  return pool;
}

export function createDrizzle(config: DbConfig) {
  const p = createPool(config);
  return drizzle(p);
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
