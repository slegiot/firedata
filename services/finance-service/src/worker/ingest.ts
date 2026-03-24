/**
 * Price ingestion worker.
 *
 * Reads tracked assets from the DB, fetches prices from all
 * registered sources, resolves conflicts, and inserts snapshots.
 */
import type { FireDataDb, Asset } from '@firedata/shared-db';
import { insertPriceSnapshot } from '@firedata/shared-db';
import type { SourceRegistry } from '../sources/index.js';

export interface IngestionResult {
  total: number;
  succeeded: number;
  failed: number;
  errors: Array<{ symbol: string; error: string }>;
}

export async function runIngestion(
  db: FireDataDb,
  registry: SourceRegistry,
): Promise<IngestionResult> {
  const result: IngestionResult = {
    total: 0,
    succeeded: 0,
    failed: 0,
    errors: [],
  };

  // Get all tracked assets
  const assets = await db
    .selectFrom('assets')
    .selectAll()
    .orderBy('symbol')
    .execute();

  result.total = assets.length;

  if (assets.length === 0) {
    console.log('[worker] No tracked assets found. Skipping ingestion.');
    return result;
  }

  console.log(`[worker] Ingesting prices for ${assets.length} assets...`);

  // Process assets in batches to avoid overwhelming sources
  const BATCH_SIZE = 5;
  for (let i = 0; i < assets.length; i += BATCH_SIZE) {
    const batch = assets.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (asset: Asset) => {
        try {
          // Fetch from all sources and store every result
          const snapshots = await registry.fetchAll(asset);

          if (snapshots.length === 0) {
            result.failed++;
            result.errors.push({
              symbol: asset.symbol,
              error: 'No source returned data',
            });
            return;
          }

          // Insert each source's snapshot
          for (const snapshot of snapshots) {
            await insertPriceSnapshot(db, {
              asset_id: asset.id,
              source: snapshot.source,
              timestamp: snapshot.timestamp,
              open: snapshot.open,
              high: snapshot.high,
              low: snapshot.low,
              close: snapshot.close,
              volume: snapshot.volume,
              raw: snapshot.raw,
            });
          }

          result.succeeded++;
          console.log(
            `[worker] ${asset.symbol}: ${snapshots.length} snapshot(s) from [${snapshots.map((s) => s.source).join(', ')}]`,
          );
        } catch (err) {
          result.failed++;
          result.errors.push({
            symbol: asset.symbol,
            error: err instanceof Error ? err.message : String(err),
          });
          console.error(`[worker] ${asset.symbol} failed:`, err);
        }
      }),
    );
  }

  console.log(
    `[worker] Ingestion complete: ${result.succeeded}/${result.total} succeeded, ${result.failed} failed`,
  );

  return result;
}
