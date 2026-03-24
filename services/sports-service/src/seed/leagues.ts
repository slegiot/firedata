/**
 * League seed data.
 *
 * Seeds major leagues per sport. Uses sport keys to resolve sport IDs
 * at runtime. Idempotent via upsertLeague.
 */
import type { FireDataDb } from '@firedata/shared-db';
import { getSportByKey, upsertLeague } from '@firedata/shared-db';

export interface LeagueSeed {
  sportKey: string;
  name: string;
  country: string | null;
  level: number;
}

export const LEAGUES: LeagueSeed[] = [
  // Soccer
  { sportKey: 'soccer', name: 'English Premier League', country: 'England', level: 1 },
  { sportKey: 'soccer', name: 'La Liga', country: 'Spain', level: 1 },
  { sportKey: 'soccer', name: 'UEFA Champions League', country: null, level: 1 },
  { sportKey: 'soccer', name: 'MLS', country: 'USA', level: 1 },

  // Cricket
  { sportKey: 'cricket', name: 'Indian Premier League', country: 'India', level: 1 },
  { sportKey: 'cricket', name: 'The Ashes', country: null, level: 1 },

  // Basketball
  { sportKey: 'basketball', name: 'NBA', country: 'USA', level: 1 },
  { sportKey: 'basketball', name: 'EuroLeague', country: null, level: 1 },

  // Hockey (field + ice)
  { sportKey: 'hockey', name: 'NHL', country: 'USA', level: 1 },
  { sportKey: 'hockey', name: 'FIH Hockey Pro League', country: null, level: 1 },

  // Tennis
  { sportKey: 'tennis', name: 'ATP Tour', country: null, level: 1 },
  { sportKey: 'tennis', name: 'WTA Tour', country: null, level: 1 },

  // Volleyball
  { sportKey: 'volleyball', name: 'FIVB Volleyball Nations League', country: null, level: 1 },

  // Table Tennis
  { sportKey: 'table_tennis', name: 'WTT Champions', country: null, level: 1 },

  // Baseball
  { sportKey: 'baseball', name: 'MLB', country: 'USA', level: 1 },
  { sportKey: 'baseball', name: 'NPB', country: 'Japan', level: 1 },

  // Golf
  { sportKey: 'golf', name: 'PGA Tour', country: 'USA', level: 1 },
  { sportKey: 'golf', name: 'European Tour', country: null, level: 1 },

  // American Football
  { sportKey: 'american_football', name: 'NFL', country: 'USA', level: 1 },
  { sportKey: 'american_football', name: 'NCAA Football', country: 'USA', level: 2 },
];

export async function seedLeagues(db: FireDataDb): Promise<void> {
  let count = 0;

  for (const league of LEAGUES) {
    const sport = await getSportByKey(db, league.sportKey);
    if (!sport) {
      console.warn(`[seed] Sport '${league.sportKey}' not found, skipping league '${league.name}'`);
      continue;
    }

    await upsertLeague(db, {
      sport_id: sport.id,
      name: league.name,
      country: league.country,
      level: league.level,
      external_ids: {},
    });
    count++;
  }

  console.log(`[seed] Seeded ${count} leagues.`);
}
