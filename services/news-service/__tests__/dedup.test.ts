import { describe, it, expect } from 'vitest';
import { contentHash } from '../src/pipeline/dedup.js';

describe('contentHash', () => {
  it('produces consistent hashes for the same input', () => {
    const h1 = contentHash('Stock Market Rallies', 'https://example.com/article/1');
    const h2 = contentHash('Stock Market Rallies', 'https://example.com/article/1');
    expect(h1).toBe(h2);
  });

  it('normalizes title case', () => {
    const h1 = contentHash('Stock Market Rallies', 'https://example.com/a');
    const h2 = contentHash('STOCK MARKET RALLIES', 'https://example.com/a');
    expect(h1).toBe(h2);
  });

  it('normalizes special characters in titles', () => {
    const h1 = contentHash('Stock Market — Rallies!', 'https://example.com/a');
    const h2 = contentHash('Stock Market  Rallies', 'https://example.com/a');
    expect(h1).toBe(h2);
  });

  it('strips www prefix from domain', () => {
    const h1 = contentHash('Test', 'https://www.example.com/a');
    const h2 = contentHash('Test', 'https://example.com/a');
    expect(h1).toBe(h2);
  });

  it('produces different hashes for different titles', () => {
    const h1 = contentHash('Article A', 'https://example.com/a');
    const h2 = contentHash('Article B', 'https://example.com/a');
    expect(h1).not.toBe(h2);
  });

  it('produces different hashes for different domains', () => {
    const h1 = contentHash('Same Title', 'https://example.com/a');
    const h2 = contentHash('Same Title', 'https://other.com/a');
    expect(h1).not.toBe(h2);
  });

  it('returns a 64-character hex string (SHA-256)', () => {
    const hash = contentHash('Test Title', 'https://example.com');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});
