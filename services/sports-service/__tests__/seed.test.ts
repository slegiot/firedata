import { describe, it, expect } from 'vitest';
import { SPORTS } from '../src/seed/sports.js';
import { LEAGUES } from '../src/seed/leagues.js';

describe('Seed Data', () => {
  describe('Sports', () => {
    it('contains exactly 10 sports', () => {
      expect(SPORTS).toHaveLength(10);
    });

    it('has unique keys', () => {
      const keys = SPORTS.map((s) => s.key);
      expect(new Set(keys).size).toBe(keys.length);
    });

    it('includes all required sports', () => {
      const keys = SPORTS.map((s) => s.key);
      expect(keys).toContain('soccer');
      expect(keys).toContain('cricket');
      expect(keys).toContain('basketball');
      expect(keys).toContain('hockey');
      expect(keys).toContain('tennis');
      expect(keys).toContain('volleyball');
      expect(keys).toContain('table_tennis');
      expect(keys).toContain('baseball');
      expect(keys).toContain('golf');
      expect(keys).toContain('american_football');
    });

    it('has non-empty names', () => {
      for (const sport of SPORTS) {
        expect(sport.name.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Leagues', () => {
    it('has at least one league per sport', () => {
      const sportKeys = SPORTS.map((s) => s.key);
      for (const key of sportKeys) {
        const leagues = LEAGUES.filter((l) => l.sportKey === key);
        expect(leagues.length, `No leagues for ${key}`).toBeGreaterThanOrEqual(1);
      }
    });

    it('references only valid sport keys', () => {
      const validKeys = new Set(SPORTS.map((s) => s.key));
      for (const league of LEAGUES) {
        expect(validKeys.has(league.sportKey), `Invalid sport key: ${league.sportKey}`).toBe(true);
      }
    });

    it('has non-empty names', () => {
      for (const league of LEAGUES) {
        expect(league.name.length).toBeGreaterThan(0);
      }
    });

    it('includes key leagues', () => {
      const names = LEAGUES.map((l) => l.name);
      expect(names).toContain('English Premier League');
      expect(names).toContain('NBA');
      expect(names).toContain('NFL');
      expect(names).toContain('Indian Premier League');
      expect(names).toContain('MLB');
    });
  });
});
