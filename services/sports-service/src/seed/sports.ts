/**
 * Sports seed data.
 *
 * Seeds the `sports` table with 10 supported sports.
 * Idempotent — uses ON CONFLICT DO NOTHING.
 */
import type { FireDataDb } from '@firedata/shared-db';

export interface SportSeed {
  key: string;
  name: string;
}

export const SPORTS: SportSeed[] = [
  { key: 'soccer', name: 'Soccer' },
  { key: 'cricket', name: 'Cricket' },
  { key: 'basketball', name: 'Basketball' },
  { key: 'hockey', name: 'Hockey' },
  { key: 'tennis', name: 'Tennis' },
  { key: 'volleyball', name: 'Volleyball' },
  { key: 'table_tennis', name: 'Table Tennis' },
  { key: 'baseball', name: 'Baseball' },
  { key: 'golf', name: 'Golf' },
  { key: 'american_football', name: 'American Football' },
];

export async function seedSports(db: FireDataDb): Promise<void> {
  for (const sport of SPORTS) {
    await db
      .insertInto('sports')
      .values(sport)
      .onConflict((oc) => oc.column('key').doNothing())
      .execute();
  }
  console.log(`[seed] Seeded ${SPORTS.length} sports.`);
}
