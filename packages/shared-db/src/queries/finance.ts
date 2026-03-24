/**
 * Finance query helpers.
 */
import type { FireDataDb } from '../db.js';
import type { NewAsset, NewAssetPriceSnapshot, NewAssetFundamental, AssetType } from '../schema.js';

/** Upsert an asset by (symbol, asset_type, exchange). Returns the asset row. */
export async function upsertAsset(db: FireDataDb, asset: NewAsset) {
  return db
    .insertInto('assets')
    .values(asset)
    .onConflict((oc) =>
      oc.columns(['symbol', 'asset_type', 'exchange']).doUpdateSet({
        name: asset.name,
        metadata: asset.metadata,
      }),
    )
    .returningAll()
    .executeTakeFirstOrThrow();
}

/** Insert a price snapshot. */
export async function insertPriceSnapshot(db: FireDataDb, snapshot: NewAssetPriceSnapshot) {
  return db
    .insertInto('asset_price_snapshots')
    .values(snapshot)
    .returningAll()
    .executeTakeFirstOrThrow();
}

/** Get the latest price snapshot for an asset. */
export async function getLatestAssetPrice(db: FireDataDb, assetId: string) {
  return db
    .selectFrom('asset_price_snapshots')
    .selectAll()
    .where('asset_id', '=', assetId)
    .orderBy('timestamp', 'desc')
    .limit(1)
    .executeTakeFirst();
}

/** Get the latest prices for multiple assets at once. */
export async function getLatestPricesForAssets(db: FireDataDb, assetIds: string[]) {
  if (assetIds.length === 0) return [];

  // Use DISTINCT ON to get the most recent row per asset_id
  return db
    .selectFrom('asset_price_snapshots')
    .distinctOn('asset_id')
    .selectAll()
    .where('asset_id', 'in', assetIds)
    .orderBy('asset_id')
    .orderBy('timestamp', 'desc')
    .execute();
}

/** Find assets by type. */
export async function getAssetsByType(db: FireDataDb, type: AssetType) {
  return db
    .selectFrom('assets')
    .selectAll()
    .where('asset_type', '=', type)
    .orderBy('symbol')
    .execute();
}

/** Insert a fundamentals record. */
export async function insertFundamental(db: FireDataDb, fundamental: NewAssetFundamental) {
  return db
    .insertInto('asset_fundamentals')
    .values(fundamental)
    .onConflict((oc) =>
      oc.columns(['asset_id', 'source', 'period', 'period_start']).doUpdateSet({
        data: fundamental.data,
      }),
    )
    .returningAll()
    .executeTakeFirstOrThrow();
}
