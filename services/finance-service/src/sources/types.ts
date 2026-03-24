/**
 * Pluggable price source interface.
 *
 * Each source implements `fetchSnapshot` to return a price data point
 * for a given asset. Sources are registered in the SourceRegistry
 * and the ingestion worker iterates over them.
 */
import type { Asset } from '@firedata/shared-db';

export interface PriceSnapshotInput {
  source: string;
  timestamp: Date;
  open: string | null;
  high: string | null;
  low: string | null;
  close: string;
  volume: string | null;
  raw: Record<string, unknown>;
}

export interface PriceSource {
  /** Unique name for this source (e.g. 'yahoo-finance', 'google-finance'). */
  readonly name: string;

  /** Trust priority — lower = more trusted. Used for conflict resolution. */
  readonly priority: number;

  /** Which asset types this source supports. */
  readonly supportedTypes: Asset['asset_type'][];

  /** Fetch a price snapshot for the given asset. Returns null if unavailable. */
  fetchSnapshot(asset: Asset): Promise<PriceSnapshotInput | null>;
}
