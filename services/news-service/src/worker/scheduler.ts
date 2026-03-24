/**
 * News ingestion scheduler.
 */
import type { FireDataDb } from '@firedata/shared-db';
import type { NewsSourceConfig } from '../sources/types.js';
import type { NewsSourceRegistry } from '../sources/registry.js';
import { runNewsIngestion } from './ingest.js';

let intervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Start the news ingestion scheduler.
 *
 * @param intervalMs — How often to run ingestion. @default 300_000 (5 min)
 */
export function startScheduler(
  db: FireDataDb,
  registry: NewsSourceRegistry,
  configs: NewsSourceConfig[],
  intervalMs = 300_000,
): void {
  if (intervalId) {
    console.log('[news-scheduler] Already running, skipping start.');
    return;
  }

  console.log(
    `[news-scheduler] Starting news ingestion every ${intervalMs / 1000}s`,
  );

  // Run immediately
  runNewsIngestion(db, registry, configs).catch((err) =>
    console.error('[news-scheduler] Initial ingestion failed:', err),
  );

  // Schedule recurring
  intervalId = setInterval(() => {
    runNewsIngestion(db, registry, configs).catch((err) =>
      console.error('[news-scheduler] Ingestion failed:', err),
    );
  }, intervalMs);
}

export function stopScheduler(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[news-scheduler] Stopped.');
  }
}
