/**
 * Odds ingestion scheduler.
 */
import type { FireDataDb } from '@firedata/shared-db';
import type { OddsSourceRegistry } from '../sources/registry.js';
import { runOddsIngestion } from './ingest.js';

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startScheduler(
  db: FireDataDb,
  registry: OddsSourceRegistry,
  intervalMs = 300_000,
): void {
  if (intervalId) {
    console.log('[odds-scheduler] Already running.');
    return;
  }

  console.log(`[odds-scheduler] Starting every ${intervalMs / 1000}s`);

  // Run immediately
  runOddsIngestion(db, registry).catch((err) =>
    console.error('[odds-scheduler] Initial ingestion failed:', err),
  );

  intervalId = setInterval(() => {
    runOddsIngestion(db, registry).catch((err) =>
      console.error('[odds-scheduler] Ingestion failed:', err),
    );
  }, intervalMs);
}

export function stopScheduler(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[odds-scheduler] Stopped.');
  }
}
