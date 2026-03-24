import { describe, it, expect } from 'vitest';
import { detectTags } from '../src/pipeline/tagger.js';

describe('detectTags', () => {
  // ── Finance ────────────────────────────────────────────────

  it('detects finance tags from stock market content', () => {
    const tags = detectTags(
      'Stock Market Hits Record High',
      'The S&P 500 and Dow Jones reached new highs on Wall Street.',
      'general',
    );
    expect(tags).toContain('finance');
  });

  it('detects finance from earnings and revenue keywords', () => {
    const tags = detectTags(
      'Apple Reports Strong Earnings',
      'Revenue exceeded expectations with strong iPhone sales.',
      'technology',
    );
    expect(tags).toContain('finance');
  });

  // ── Sports ─────────────────────────────────────────────────

  it('detects sports tags', () => {
    const tags = detectTags(
      'Premier League: Liverpool wins championship',
      'The team scored three goals in a dominant match performance.',
      'general',
    );
    expect(tags).toContain('sports');
  });

  it('detects sports from NBA/NFL keywords', () => {
    const tags = detectTags(
      'NBA Playoffs: Lakers advance',
      'The basketball team won in overtime.',
      'general',
    );
    expect(tags).toContain('sports');
  });

  // ── Technology ─────────────────────────────────────────────

  it('detects technology tags', () => {
    const tags = detectTags(
      'OpenAI Launches New AI Model',
      'The artificial intelligence startup unveiled its latest neural network.',
      'general',
    );
    expect(tags).toContain('technology');
  });

  // ── Politics ───────────────────────────────────────────────

  it('detects politics tags', () => {
    const tags = detectTags(
      'Senate Passes New Legislation',
      'Congress approved the bill after a heated election season debate.',
      'general',
    );
    expect(tags).toContain('politics');
  });

  // ── Crypto ─────────────────────────────────────────────────

  it('detects crypto tags', () => {
    const tags = detectTags(
      'Bitcoin Surges Past $100K',
      'Ethereum and other altcoins also rallied as crypto markets boomed.',
      'general',
    );
    expect(tags).toContain('crypto');
  });

  // ── Multi-tag ──────────────────────────────────────────────

  it('assigns multiple tags when content spans categories', () => {
    const tags = detectTags(
      'Coinbase Stock Surges on Crypto Trading Revenue',
      'The nasdaq-listed company reported strong earnings from bitcoin trading.',
      'general',
    );
    expect(tags).toContain('finance');
    expect(tags).toContain('crypto');
  });

  // ── Fallback ───────────────────────────────────────────────

  it('falls back to category hint when no keywords match', () => {
    const tags = detectTags(
      'A Pleasant Day in the Park',
      'People enjoyed the sunshine and birds were singing.',
      'lifestyle',
    );
    expect(tags).toEqual(['lifestyle']);
  });

  // ── Deduplication ──────────────────────────────────────────

  it('returns unique tags only', () => {
    const tags = detectTags(
      'Bitcoin and Ethereum Crypto Rally',
      'The crypto market saw bitcoin and ethereum prices surge.',
      'crypto', // hint is also crypto
    );
    // Should not have duplicate 'crypto'
    const unique = [...new Set(tags)];
    expect(tags.length).toBe(unique.length);
  });

  // ── Null body ──────────────────────────────────────────────

  it('works with null body', () => {
    const tags = detectTags('Stock Market Update', null, 'finance');
    expect(tags).toContain('finance');
  });
});
