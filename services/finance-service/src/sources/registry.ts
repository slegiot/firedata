/**
 * Source registry — manages registered price sources and
 * resolves conflicts when multiple sources return data.
 */
import type { Asset } from '@firedata/shared-db';
import type { PriceSource, PriceSnapshotInput } from './types.js';

export class SourceRegistry {
  private sources: PriceSource[] = [];

  /** Register a new price source. */
  register(source: PriceSource): void {
    this.sources.push(source);
    // Keep sorted by priority (lowest = most trusted)
    this.sources.sort((a, b) => a.priority - b.priority);
  }

  /** Get all registered source names. */
  getSourceNames(): string[] {
    return this.sources.map((s) => s.name);
  }

  /**
   * Fetch snapshots from all applicable sources for a given asset.
   * Returns the best snapshot based on conflict resolution rules.
   */
  async fetchBest(asset: Asset): Promise<PriceSnapshotInput | null> {
    const applicable = this.sources.filter((s) =>
      s.supportedTypes.includes(asset.asset_type),
    );

    if (applicable.length === 0) return null;

    // Fetch from all sources in parallel
    const results = await Promise.allSettled(
      applicable.map((source) => source.fetchSnapshot(asset)),
    );

    // Collect successful results
    const snapshots: PriceSnapshotInput[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        snapshots.push(result.value);
      }
    }

    if (snapshots.length === 0) return null;

    return this.resolve(snapshots);
  }

  /**
   * Fetch from ALL sources and return every successful result.
   * Useful when you want to store snapshots from every source.
   */
  async fetchAll(asset: Asset): Promise<PriceSnapshotInput[]> {
    const applicable = this.sources.filter((s) =>
      s.supportedTypes.includes(asset.asset_type),
    );

    const results = await Promise.allSettled(
      applicable.map((source) => source.fetchSnapshot(asset)),
    );

    const snapshots: PriceSnapshotInput[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        snapshots.push(result.value);
      }
    }

    return snapshots;
  }

  /**
   * Conflict resolution:
   * 1. Prefer the snapshot with the freshest timestamp.
   * 2. If timestamps are identical (within 60s), prefer by trust priority.
   */
  private resolve(snapshots: PriceSnapshotInput[]): PriceSnapshotInput {
    return snapshots.reduce((best, current) => {
      const timeDiff = Math.abs(
        current.timestamp.getTime() - best.timestamp.getTime(),
      );

      // If within 60 seconds, use trust priority
      if (timeDiff < 60_000) {
        const bestPriority = this.getPriority(best.source);
        const currentPriority = this.getPriority(current.source);
        return currentPriority < bestPriority ? current : best;
      }

      // Otherwise prefer the freshest
      return current.timestamp > best.timestamp ? current : best;
    });
  }

  private getPriority(sourceName: string): number {
    const source = this.sources.find((s) => s.name === sourceName);
    return source?.priority ?? Infinity;
  }
}
