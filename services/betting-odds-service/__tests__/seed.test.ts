import { describe, it, expect } from 'vitest';
import { BOOKMAKERS } from '../src/seed/bookmakers.js';
import { MARKETS } from '../src/seed/markets.js';

describe('Seed Data', () => {
  describe('Bookmakers', () => {
    it('contains exactly 20 bookmakers', () => {
      expect(BOOKMAKERS).toHaveLength(20);
    });

    it('has unique names', () => {
      const names = BOOKMAKERS.map((b) => b.name);
      expect(new Set(names).size).toBe(names.length);
    });

    it('has sequential ranks', () => {
      const ranks = BOOKMAKERS.map((b) => b.external_rank);
      expect(ranks).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
    });

    it('has valid URLs', () => {
      for (const bm of BOOKMAKERS) {
        expect(bm.url).toMatch(/^https?:\/\//);
      }
    });

    it('has non-empty country', () => {
      for (const bm of BOOKMAKERS) {
        expect(bm.country.length).toBeGreaterThan(0);
      }
    });

    it('includes key bookmakers', () => {
      const names = BOOKMAKERS.map((b) => b.name);
      expect(names).toContain('Bet365');
      expect(names).toContain('DraftKings');
      expect(names).toContain('FanDuel');
      expect(names).toContain('Pinnacle');
    });
  });

  describe('Markets', () => {
    it('has at least 15 markets', () => {
      expect(MARKETS.length).toBeGreaterThanOrEqual(15);
    });

    it('includes soccer 1X2 market', () => {
      const soccer1x2 = MARKETS.find(
        (m) => m.sportKey === 'soccer' && m.key === 'match_winner_1x2',
      );
      expect(soccer1x2).toBeDefined();
    });

    it('has non-empty names', () => {
      for (const market of MARKETS) {
        expect(market.name.length).toBeGreaterThan(0);
      }
    });

    it('covers multiple sports', () => {
      const sportKeys = new Set(MARKETS.map((m) => m.sportKey));
      expect(sportKeys.size).toBeGreaterThanOrEqual(5);
    });
  });
});
