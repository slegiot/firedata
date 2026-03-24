import { describe, it, expect, vi } from 'vitest';
import { FootballDataAdapter } from '../src/adapters/football-data.js';

// ── Sample markdown fixtures ───────────────────────────────────

const TABLE_MARKDOWN = `
# Premier League Fixtures

## Matchday 29

| Team | Score | Team | Status |
|------|-------|------|--------|
| Arsenal | 2 - 1 | Chelsea | Completed |
| Liverpool | 0 - 0 | Man City | Live |
| Tottenham | 3 - 2 | Everton | Completed |
`;

const VS_MARKDOWN = `
## Upcoming Matches

Manchester United vs Newcastle — 15:00 — Scheduled
Aston Villa vs Brighton — 17:30 — Scheduled
West Ham vs Crystal Palace — 12:30 — FT
`;

const MIXED_MARKDOWN = `
# Results

| Team | Score | Team | Status |
|------|-------|------|--------|
| Bayern | 4 - 0 | Dortmund | Completed |

## Next Fixtures

Real Madrid vs Barcelona — 21:00 — Scheduled
`;

function mockFirecrawl(markdown: string, success = true) {
  return {
    scrape: vi.fn().mockResolvedValue({
      success,
      data: { markdown: success ? markdown : '', url: '', metadata: {} },
    }),
  } as any;
}

// ── Tests ──────────────────────────────────────────────────────

describe('FootballDataAdapter', () => {
  describe('parseFixtures — table format', () => {
    it('extracts games from markdown tables', () => {
      const adapter = new FootballDataAdapter(mockFirecrawl(''));
      const games = adapter.parseFixtures(TABLE_MARKDOWN);

      expect(games).toHaveLength(3);
    });

    it('parses team names correctly', () => {
      const adapter = new FootballDataAdapter(mockFirecrawl(''));
      const games = adapter.parseFixtures(TABLE_MARKDOWN);

      expect(games[0].homeTeam).toBe('Arsenal');
      expect(games[0].awayTeam).toBe('Chelsea');
    });

    it('parses scores correctly', () => {
      const adapter = new FootballDataAdapter(mockFirecrawl(''));
      const games = adapter.parseFixtures(TABLE_MARKDOWN);

      expect(games[0].score).toEqual({ home: 2, away: 1 });
      expect(games[1].score).toEqual({ home: 0, away: 0 });
    });

    it('normalizes status correctly', () => {
      const adapter = new FootballDataAdapter(mockFirecrawl(''));
      const games = adapter.parseFixtures(TABLE_MARKDOWN);

      expect(games[0].status).toBe('completed');
      expect(games[1].status).toBe('live');
    });
  });

  describe('parseFixtures — vs format', () => {
    it('extracts games from "vs" patterns', () => {
      const adapter = new FootballDataAdapter(mockFirecrawl(''));
      const games = adapter.parseFixtures(VS_MARKDOWN);

      expect(games.length).toBeGreaterThanOrEqual(2);
    });

    it('parses scheduled status', () => {
      const adapter = new FootballDataAdapter(mockFirecrawl(''));
      const games = adapter.parseFixtures(VS_MARKDOWN);
      const scheduled = games.filter((g) => g.status === 'scheduled');

      expect(scheduled.length).toBeGreaterThanOrEqual(2);
    });

    it('normalizes FT to completed', () => {
      const adapter = new FootballDataAdapter(mockFirecrawl(''));
      const games = adapter.parseFixtures(VS_MARKDOWN);
      const completed = games.filter((g) => g.status === 'completed');

      expect(completed.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('parseFixtures — mixed format', () => {
    it('extracts games from both table and vs formats', () => {
      const adapter = new FootballDataAdapter(mockFirecrawl(''));
      const games = adapter.parseFixtures(MIXED_MARKDOWN);

      expect(games.length).toBeGreaterThanOrEqual(2);
      const teams = games.map((g) => g.homeTeam);
      expect(teams).toContain('Bayern');
    });
  });

  describe('fetch', () => {
    it('calls firecrawl.scrape with correct URL', async () => {
      const firecrawl = mockFirecrawl(TABLE_MARKDOWN);
      const adapter = new FootballDataAdapter(firecrawl);

      await adapter.fetchGames({
        leagueName: 'EPL',
        sportKey: 'soccer',
        adapterType: 'football-data',
        url: 'https://example.com/fixtures',
        updateFrequencyMs: 300_000,
        enabled: true,
      });

      expect(firecrawl.scrape).toHaveBeenCalledWith(
        'https://example.com/fixtures',
        expect.objectContaining({ formats: ['markdown'] }),
      );
    });

    it('returns empty array on scrape failure', async () => {
      const firecrawl = mockFirecrawl('', false);
      const adapter = new FootballDataAdapter(firecrawl);

      const games = await adapter.fetchGames({
        leagueName: 'EPL',
        sportKey: 'soccer',
        adapterType: 'football-data',
        url: 'https://example.com/fixtures',
        updateFrequencyMs: 300_000,
        enabled: true,
      });

      expect(games).toHaveLength(0);
    });
  });

  describe('NormalizedGame structure', () => {
    it('produces valid NormalizedGame objects', () => {
      const adapter = new FootballDataAdapter(mockFirecrawl(''));
      const games = adapter.parseFixtures(TABLE_MARKDOWN);

      for (const game of games) {
        expect(game.externalId).toBeTruthy();
        expect(game.homeTeam).toBeTruthy();
        expect(game.awayTeam).toBeTruthy();
        expect(game.startTime).toBeInstanceOf(Date);
        expect(['scheduled', 'live', 'completed', 'postponed', 'cancelled']).toContain(game.status);
        expect(typeof game.score).toBe('object');
        expect(typeof game.metadata).toBe('object');
      }
    });
  });
});
