/**
 * Default league adapter configurations.
 *
 * Maps leagues to their upstream data sources.
 * Can be extended via DB/env in the future.
 */
import type { LeagueAdapterConfig } from './types.js';

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const THIRTY_MINUTES = 30 * 60 * 1000;

export const LEAGUE_CONFIGS: LeagueAdapterConfig[] = [
  // Soccer — Firecrawl HTML scraping
  {
    leagueName: 'English Premier League',
    sportKey: 'soccer',
    adapterType: 'football-data',
    url: 'https://www.bbc.com/sport/football/premier-league/scores-fixtures',
    updateFrequencyMs: FIFTEEN_MINUTES,
    enabled: true,
  },
  {
    leagueName: 'La Liga',
    sportKey: 'soccer',
    adapterType: 'football-data',
    url: 'https://www.bbc.com/sport/football/spanish-la-liga/scores-fixtures',
    updateFrequencyMs: THIRTY_MINUTES,
    enabled: true,
  },
  {
    leagueName: 'UEFA Champions League',
    sportKey: 'soccer',
    adapterType: 'football-data',
    url: 'https://www.bbc.com/sport/football/champions-league/scores-fixtures',
    updateFrequencyMs: FIFTEEN_MINUTES,
    enabled: true,
  },
];
