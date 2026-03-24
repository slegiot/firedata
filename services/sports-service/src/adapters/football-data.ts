/**
 * Football (soccer) adapter using Firecrawl HTML scraping.
 *
 * Scrapes fixture pages to extract match data for soccer leagues.
 * This serves as the concrete adapter example — all other sport
 * adapters follow the same LeagueAdapter interface.
 */
import type { FirecrawlClient } from '@firedata/shared-firecrawl-client';
import type { GameStatus } from '@firedata/shared-db';
import type { LeagueAdapter, LeagueAdapterConfig, NormalizedGame } from './types.js';

export class FootballDataAdapter implements LeagueAdapter {
  readonly type = 'football-data';

  constructor(private readonly firecrawl: FirecrawlClient) {}

  async fetchGames(config: LeagueAdapterConfig): Promise<NormalizedGame[]> {
    try {
      const result = await this.firecrawl.scrape(config.url, {
        formats: ['markdown'],
        timeout: 20_000,
      });

      if (!result.success || !result.data.markdown) {
        console.error(`[football-data] ${config.leagueName}: Scrape failed`);
        return [];
      }

      return this.parseFixtures(result.data.markdown);
    } catch (err) {
      console.error(`[football-data] ${config.leagueName}: Error:`, err);
      return [];
    }
  }

  /**
   * Parse football fixture markdown into NormalizedGame[].
   * Exported for testing.
   *
   * Expected patterns in scraped markdown:
   * - Table rows: | Home Team | 2 - 1 | Away Team | Completed |
   * - List items: Home Team vs Away Team — 14:00 — Scheduled
   * - Score patterns: Team A 3 – 0 Team B
   */
  parseFixtures(markdown: string): NormalizedGame[] {
    const games: NormalizedGame[] = [];

    // Pattern 1: Markdown table rows — | Home | Score | Away | Status |
    const tablePattern = /\|\s*([^|]{2,40})\s*\|\s*(\d+)\s*[-–]\s*(\d+)\s*\|\s*([^|]{2,40})\s*\|\s*(completed|live|scheduled|postponed|cancelled)\s*\|/gi;
    let match: RegExpExecArray | null;

    while ((match = tablePattern.exec(markdown)) !== null) {
      const [, homeTeam, homeScore, awayScore, awayTeam, status] = match;
      games.push({
        externalId: `ft-${homeTeam.trim()}-${awayTeam.trim()}-${Date.now()}`.toLowerCase().replace(/\s+/g, '-'),
        homeTeam: homeTeam.trim(),
        awayTeam: awayTeam.trim(),
        homeTeamShort: null,
        awayTeamShort: null,
        startTime: new Date(),
        status: this.normalizeStatus(status.trim()),
        score: {
          home: Number(homeScore),
          away: Number(awayScore),
        },
        metadata: {},
      });
    }

    // Pattern 2: "Team A vs Team B" style lines, optionally followed by time and status
    const vsPattern = /([A-Z][A-Za-z\s.]{2,}?)\s+(?:vs\.?|v)\s+([A-Z][A-Za-z\s.]{2,}?)\s*(?:[-–—]\s*(\d{1,2}:\d{2})\s*)?(?:[-–—]\s*(scheduled|live|completed|postponed|cancelled|FT|HT|finished)\s*)?$/gim;

    while ((match = vsPattern.exec(markdown)) !== null) {
      const [, homeTeam, awayTeam, time, status] = match;

      // Skip if already captured via table pattern
      const ht = homeTeam.trim();
      const at = awayTeam.trim();
      const duplicate = games.some(
        (g) => g.homeTeam === ht && g.awayTeam === at,
      );
      if (duplicate) continue;

      let startTime = new Date();
      if (time) {
        const [hours, minutes] = time.split(':').map(Number);
        startTime.setHours(hours, minutes, 0, 0);
      }

      games.push({
        externalId: `ft-${ht}-${at}-${Date.now()}`.toLowerCase().replace(/\s+/g, '-'),
        homeTeam: ht,
        awayTeam: at,
        homeTeamShort: null,
        awayTeamShort: null,
        startTime,
        status: status ? this.normalizeStatus(status.trim()) : 'scheduled',
        score: {},
        metadata: {},
      });
    }

    return games;
  }

  private normalizeStatus(raw: string): GameStatus {
    const lower = raw.toLowerCase();
    if (lower === 'ft' || lower === 'completed' || lower === 'finished') return 'completed';
    if (lower === 'ht' || lower === 'live' || lower === 'in play') return 'live';
    if (lower === 'postponed' || lower === 'ppd') return 'postponed';
    if (lower === 'cancelled' || lower === 'canceled') return 'cancelled';
    return 'scheduled';
  }
}
