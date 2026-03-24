/**
 * Cron scheduler for the ingestion worker.
 */
import type { FireDataDb } from '@firedata/shared-db';
import type { SourceRegistry } from '../sources/index.js';
import { runIngestion } from './ingest.js';

let intervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Start the ingestion scheduler.
 *
 * @param intervalMs — How often to run ingestion, in ms. @default 300_000 (5 min)
 */
export function startScheduler(
  db: FireDataDb,
  registry: SourceRegistry,
  intervalMs = 300_000,
): void {
  if (intervalId) {
    console.log('[scheduler] Already running, skipping start.');
    return;
  }

  console.log(
    `[scheduler] Starting price ingestion every ${intervalMs / 1000}s`,
  );

  // Run immediately on start
  runIngestion(db, registry).catch((err) =>
    console.error('[scheduler] Initial ingestion failed:', err),
  );

  // Then schedule recurring runs
  intervalId = setInterval(() => {
    runIngestion(db, registry).catch((err) =>
      console.error('[scheduler] Ingestion failed:', err),
    );
  }, intervalMs);
}

export function stopScheduler(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[scheduler] Stopped.');
  }
}
