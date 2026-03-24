/**
 * Bookmaker seed data.
 *
 * Top ~20 sports betting platforms globally.
 * Placeholder entries — can be updated later with verified URLs.
 * Idempotent via upsertBookmaker.
 */
import type { FireDataDb } from '@firedata/shared-db';
import { upsertBookmaker } from '@firedata/shared-db';

export interface BookmakerSeed {
  name: string;
  url: string;
  country: string;
  external_rank: number;
}

export const BOOKMAKERS: BookmakerSeed[] = [
  { name: 'Bet365', url: 'https://www.bet365.com', country: 'UK', external_rank: 1 },
  { name: 'DraftKings', url: 'https://www.draftkings.com', country: 'USA', external_rank: 2 },
  { name: 'FanDuel', url: 'https://www.fanduel.com', country: 'USA', external_rank: 3 },
  { name: 'William Hill', url: 'https://www.williamhill.com', country: 'UK', external_rank: 4 },
  { name: 'Betway', url: 'https://www.betway.com', country: 'UK', external_rank: 5 },
  { name: 'Paddy Power', url: 'https://www.paddypower.com', country: 'Ireland', external_rank: 6 },
  { name: 'Betfair', url: 'https://www.betfair.com', country: 'UK', external_rank: 7 },
  { name: '888sport', url: 'https://www.888sport.com', country: 'UK', external_rank: 8 },
  { name: 'Unibet', url: 'https://www.unibet.com', country: 'Sweden', external_rank: 9 },
  { name: 'BetMGM', url: 'https://www.betmgm.com', country: 'USA', external_rank: 10 },
  { name: 'Pinnacle', url: 'https://www.pinnacle.com', country: 'Curaçao', external_rank: 11 },
  { name: 'Bwin', url: 'https://www.bwin.com', country: 'Austria', external_rank: 12 },
  { name: '1xBet', url: 'https://www.1xbet.com', country: 'Cyprus', external_rank: 13 },
  { name: 'PointsBet', url: 'https://www.pointsbet.com', country: 'Australia', external_rank: 14 },
  { name: 'Ladbrokes', url: 'https://www.ladbrokes.com', country: 'UK', external_rank: 15 },
  { name: 'Coral', url: 'https://www.coral.co.uk', country: 'UK', external_rank: 16 },
  { name: 'Sportsbet', url: 'https://www.sportsbet.com.au', country: 'Australia', external_rank: 17 },
  { name: 'Betsson', url: 'https://www.betsson.com', country: 'Sweden', external_rank: 18 },
  { name: 'Caesars Sportsbook', url: 'https://www.caesars.com/sportsbook-and-casino', country: 'USA', external_rank: 19 },
  { name: 'Sky Bet', url: 'https://www.skybet.com', country: 'UK', external_rank: 20 },
];

export async function seedBookmakers(db: FireDataDb): Promise<void> {
  for (const bm of BOOKMAKERS) {
    await upsertBookmaker(db, bm);
  }
  console.log(`[seed] Seeded ${BOOKMAKERS.length} bookmakers.`);
}
