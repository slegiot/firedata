/**
 * Simple migration runner that reads SQL files from the migrations/
 * directory and executes them in order against the database.
 *
 * Tracks applied migrations in a `_migrations` table.
 *
 * Usage: DATABASE_URL=postgres://... npx tsx src/migrate.ts
 */
import { Pool } from 'pg';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

// migrations/ directory is one level up from src/
const MIGRATIONS_DIR = join(__dirname, '..', 'migrations');

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');

  const pool = new Pool({ connectionString: url });

  // Ensure migrations tracking table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Get already-applied migrations
  const { rows: applied } = await pool.query<{ name: string }>(
    'SELECT name FROM _migrations ORDER BY name',
  );
  const appliedSet = new Set(applied.map((r) => r.name));

  // Read migration files
  const files = (await readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (appliedSet.has(file)) {
      console.log(`⏭  ${file} (already applied)`);
      continue;
    }

    console.log(`▶  Applying ${file}...`);
    const sql = await readFile(join(MIGRATIONS_DIR, file), 'utf-8');

    await pool.query(sql);
    await pool.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
    console.log(`✅ ${file} applied`);
  }

  await pool.end();
  console.log('\nDone.');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
