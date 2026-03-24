import { describe, it, expect, vi } from 'vitest';
import { SoccerOddsAdapter } from '../src/sources/soccer-odds.js';

// ── Sample markdown fixtures ───────────────────────────────────

const ODDS_LABELED = `
# Arsenal vs Chelsea — Match Odds

Home 1.85 | Draw 3.40 | Away 4.20

Over 2.5: 1.72 Under 2.5: 2.10
`;

const ODDS_TABLE = `
## Odds Comparison

| Home | Draw | Away |
|------|------|------|
| 1.90 | 3.50 | 4.00 |
`;

const ODDS_SLASH = `
Match Winner: 2.10 / 3.25 / 3.60

Goals O/U:
Over 2.5: 1.80 Under 2.5: 2.00
`;

const NO_ODDS_MARKDOWN = `
# Match Preview

Arsenal take on Chelsea at the Emirates Stadium.
Join us for kickoff at 3pm.
`;

function mockFirecrawl(markdown: string, success = true) {
  return {
    scrape: vi.fn().mockResolvedValue({
      success,
      data: { markdown: success ? markdown : '', url: '', metadata: {} },
    }),
  } as any;
}

function mockBookmaker(id = 'bk-1', name = 'TestBet', url = 'https://testbet.com') {
  return { id, name, url, country: 'UK', external_rank: 1, created_at: new Date() } as any;
}

function mockGame(id = 'game-1') {
  return {
    id,
    league_id: 'league-1',
    home_team_id: 'team-1',
    away_team_id: 'team-2',
    start_time: new Date(),
    status: 'scheduled' as const,
    score: {},
    metadata: { externalId: 'ext-123' },
    created_at: new Date(),
    updated_at: new Date(),
  } as any;
}

// ── Tests ──────────────────────────────────────────────────────

describe('SoccerOddsAdapter', () => {
  describe('parseOdds — labeled format', () => {
    it('parses 1X2 odds', () => {
      const adapter = new SoccerOddsAdapter(mockFirecrawl(''));
      const markets = adapter.parseOdds(ODDS_LABELED, ['match_winner_1x2']);

      expect(markets).toHaveLength(1);
      expect(markets[0].marketKey).toBe('match_winner_1x2');
      expect(markets[0].odds).toEqual({ home: 1.85, draw: 3.40, away: 4.20 });
    });

    it('parses over/under 2.5', () => {
      const adapter = new SoccerOddsAdapter(mockFirecrawl(''));
      const markets = adapter.parseOdds(ODDS_LABELED, ['over_under_2_5']);

      expect(markets).toHaveLength(1);
      expect(markets[0].marketKey).toBe('over_under_2_5');
      expect(markets[0].odds).toEqual({ over: 1.72, under: 2.10 });
    });

    it('parses both markets together', () => {
      const adapter = new SoccerOddsAdapter(mockFirecrawl(''));
      const markets = adapter.parseOdds(ODDS_LABELED, ['match_winner_1x2', 'over_under_2_5']);

      expect(markets).toHaveLength(2);
    });
  });

  describe('parseOdds — table format', () => {
    it('parses 1X2 from table', () => {
      const adapter = new SoccerOddsAdapter(mockFirecrawl(''));
      const markets = adapter.parseOdds(ODDS_TABLE, ['match_winner_1x2']);

      expect(markets).toHaveLength(1);
      expect(markets[0].odds).toEqual({ home: 1.90, draw: 3.50, away: 4.00 });
    });
  });

  describe('parseOdds — slash format', () => {
    it('parses 1X2 from slash-separated', () => {
      const adapter = new SoccerOddsAdapter(mockFirecrawl(''));
      const markets = adapter.parseOdds(ODDS_SLASH, ['match_winner_1x2']);

      expect(markets).toHaveLength(1);
      expect(markets[0].odds).toEqual({ home: 2.10, draw: 3.25, away: 3.60 });
    });

    it('parses over/under from slash format', () => {
      const adapter = new SoccerOddsAdapter(mockFirecrawl(''));
      const markets = adapter.parseOdds(ODDS_SLASH, ['over_under_2_5']);

      expect(markets).toHaveLength(1);
      expect(markets[0].odds).toEqual({ over: 1.80, under: 2.00 });
    });
  });

  describe('parseOdds — no odds', () => {
    it('returns empty array when no odds found', () => {
      const adapter = new SoccerOddsAdapter(mockFirecrawl(''));
      const markets = adapter.parseOdds(NO_ODDS_MARKDOWN, ['match_winner_1x2']);

      expect(markets).toHaveLength(0);
    });
  });

  describe('fetchOddsForGame', () => {
    it('calls firecrawl.scrape with bookmaker URL', async () => {
      const firecrawl = mockFirecrawl(ODDS_LABELED);
      const adapter = new SoccerOddsAdapter(firecrawl);

      await adapter.fetchOddsForGame(
        mockBookmaker(),
        mockGame(),
        ['match_winner_1x2'],
      );

      expect(firecrawl.scrape).toHaveBeenCalledWith(
        expect.stringContaining('testbet.com'),
        expect.objectContaining({ formats: ['markdown'] }),
      );
    });

    it('returns snapshot with correct structure', async () => {
      const adapter = new SoccerOddsAdapter(mockFirecrawl(ODDS_LABELED));

      const snapshot = await adapter.fetchOddsForGame(
        mockBookmaker('bk-42'),
        mockGame('game-99'),
        ['match_winner_1x2'],
      );

      expect(snapshot).not.toBeNull();
      expect(snapshot!.bookmakerId).toBe('bk-42');
      expect(snapshot!.gameId).toBe('game-99');
      expect(snapshot!.capturedAt).toBeInstanceOf(Date);
      expect(snapshot!.markets).toHaveLength(1);
    });

    it('returns null on scrape failure', async () => {
      const adapter = new SoccerOddsAdapter(mockFirecrawl('', false));

      const snapshot = await adapter.fetchOddsForGame(
        mockBookmaker(),
        mockGame(),
        ['match_winner_1x2'],
      );

      expect(snapshot).toBeNull();
    });

    it('returns null when no odds found', async () => {
      const adapter = new SoccerOddsAdapter(mockFirecrawl(NO_ODDS_MARKDOWN));

      const snapshot = await adapter.fetchOddsForGame(
        mockBookmaker(),
        mockGame(),
        ['match_winner_1x2'],
      );

      expect(snapshot).toBeNull();
    });

    it('returns null when bookmaker has no URL', async () => {
      const adapter = new SoccerOddsAdapter(mockFirecrawl(ODDS_LABELED));
      const noUrlBookmaker = mockBookmaker('bk-1', 'NoURL', '');

      const snapshot = await adapter.fetchOddsForGame(
        noUrlBookmaker,
        mockGame(),
        ['match_winner_1x2'],
      );

      expect(snapshot).toBeNull();
    });
  });

  describe('OddsValues structure', () => {
    it('includes raw match data', () => {
      const adapter = new SoccerOddsAdapter(mockFirecrawl(''));
      const markets = adapter.parseOdds(ODDS_LABELED, ['match_winner_1x2']);

      expect(markets[0].raw).toBeDefined();
      expect(markets[0].raw.matchedPattern).toBeTruthy();
    });
  });
});
