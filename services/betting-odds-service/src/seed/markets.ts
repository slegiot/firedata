/**
 * Market seed data.
 *
 * Common betting markets across sports.
 * Idempotent via upsertMarket (sport_id + key).
 */
import type { FireDataDb } from '@firedata/shared-db';
import { getSportByKey, upsertMarket } from '@firedata/shared-db';

export interface MarketSeed {
  sportKey: string;
  key: string;
  name: string;
}

export const MARKETS: MarketSeed[] = [
  // Soccer
  { sportKey: 'soccer', key: 'match_winner_1x2', name: 'Match Winner (1X2)' },
  { sportKey: 'soccer', key: 'over_under_2_5', name: 'Over/Under 2.5 Goals' },
  { sportKey: 'soccer', key: 'both_teams_score', name: 'Both Teams to Score' },
  { sportKey: 'soccer', key: 'double_chance', name: 'Double Chance' },
  { sportKey: 'soccer', key: 'asian_handicap', name: 'Asian Handicap' },

  // Basketball
  { sportKey: 'basketball', key: 'moneyline', name: 'Moneyline' },
  { sportKey: 'basketball', key: 'spread', name: 'Point Spread' },
  { sportKey: 'basketball', key: 'totals', name: 'Totals (Over/Under)' },

  // American Football
  { sportKey: 'american_football', key: 'moneyline', name: 'Moneyline' },
  { sportKey: 'american_football', key: 'spread', name: 'Point Spread' },
  { sportKey: 'american_football', key: 'totals', name: 'Totals (Over/Under)' },

  // Tennis
  { sportKey: 'tennis', key: 'match_winner', name: 'Match Winner' },
  { sportKey: 'tennis', key: 'set_betting', name: 'Set Betting' },

  // Cricket
  { sportKey: 'cricket', key: 'match_winner', name: 'Match Winner' },
  { sportKey: 'cricket', key: 'top_batsman', name: 'Top Batsman' },

  // Hockey
  { sportKey: 'hockey', key: 'moneyline', name: 'Moneyline' },
  { sportKey: 'hockey', key: 'puck_line', name: 'Puck Line' },

  // Baseball
  { sportKey: 'baseball', key: 'moneyline', name: 'Moneyline' },
  { sportKey: 'baseball', key: 'run_line', name: 'Run Line' },
];

export async function seedMarkets(db: FireDataDb): Promise<void> {
  let count = 0;

  for (const market of MARKETS) {
    const sport = await getSportByKey(db, market.sportKey);
    if (!sport) {
      console.warn(`[seed] Sport '${market.sportKey}' not found, skipping market '${market.key}'`);
      continue;
    }

    await upsertMarket(db, {
      sport_id: sport.id,
      key: market.key,
      name: market.name,
    });
    count++;
  }

  console.log(`[seed] Seeded ${count} markets.`);
}
