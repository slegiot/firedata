/**
 * Sports ingestion scheduler.
 */
import type { FireDataDb } from '@firedata/shared-db';
import type { LeagueAdapterConfig } from '../adapters/types.js';
import type { AdapterRegistry } from '../adapters/registry.js';
import { runSportsIngestion } from './ingest.js';

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startScheduler(
  db: FireDataDb,
  registry: AdapterRegistry,
  configs: LeagueAdapterConfig[],
  intervalMs = 300_000,
): void {
  if (intervalId) {
    console.log('[sports-scheduler] Already running.');
    return;
  }

  console.log(`[sports-scheduler] Starting every ${intervalMs / 1000}s`);

  // Run immediately
  runSportsIngestion(db, registry, configs).catch((err) =>
    console.error('[sports-scheduler] Initial ingestion failed:', err),
  );

  intervalId = setInterval(() => {
    runSportsIngestion(db, registry, configs).catch((err) =>
      console.error('[sports-scheduler] Ingestion failed:', err),
    );
  }, intervalMs);
}

export function stopScheduler(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[sports-scheduler] Stopped.');
  }
}
