import { describe, it, expect } from 'vitest';
import { hashApiKey, generateApiKey } from '../src/middleware/auth.js';
import { wrapResponse } from '../src/envelope.js';

describe('Auth Utilities', () => {
  describe('hashApiKey', () => {
    it('produces consistent SHA-256 hash', () => {
      const key = 'fd_live_testkey123';
      const hash1 = hashApiKey(key);
      const hash2 = hashApiKey(key);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex
    });

    it('produces different hashes for different keys', () => {
      const hash1 = hashApiKey('key_a');
      const hash2 = hashApiKey('key_b');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('generateApiKey', () => {
    it('generates key with fd_live_ prefix', () => {
      const { raw } = generateApiKey();
      expect(raw.startsWith('fd_live_')).toBe(true);
    });

    it('generates matching hash', () => {
      const { raw, hash } = generateApiKey();
      expect(hashApiKey(raw)).toBe(hash);
    });

    it('generates prefix from first 10 chars', () => {
      const { raw, prefix } = generateApiKey();
      expect(prefix).toBe(raw.slice(0, 10));
    });

    it('generates unique keys', () => {
      const keys = Array.from({ length: 10 }, () => generateApiKey());
      const raws = keys.map((k) => k.raw);
      expect(new Set(raws).size).toBe(10);
    });
  });
});

describe('Response Envelope', () => {
  it('wraps data with meta', () => {
    const result = wrapResponse({ items: [1, 2, 3] }, 'finance-service');

    expect(result.data).toEqual({ items: [1, 2, 3] });
    expect(result.meta.source).toBe('finance-service');
    expect(result.meta.cached).toBe(false);
    expect(result.meta.fetched_at).toBeTruthy();
  });

  it('sets cached flag', () => {
    const result = wrapResponse({}, 'news-service', true);

    expect(result.meta.cached).toBe(true);
  });

  it('includes ISO timestamp', () => {
    const result = wrapResponse({}, 'sports-service');
    const date = new Date(result.meta.fetched_at);

    expect(date.getTime()).not.toBeNaN();
  });
});

describe('Service Proxy', () => {
  // Note: proxyGet tests would require mocking fetch, which is heavy.
  // Basic structure validation only.

  it('getServiceUrls returns all four services', async () => {
    const { getServiceUrls } = await import('../src/proxy.js');
    const urls = getServiceUrls();

    expect(urls.finance).toBeTruthy();
    expect(urls.news).toBeTruthy();
    expect(urls.sports).toBeTruthy();
    expect(urls.odds).toBeTruthy();
  });

  it('defaults to localhost URLs', async () => {
    const { getServiceUrls } = await import('../src/proxy.js');
    const urls = getServiceUrls();

    expect(urls.finance).toContain('localhost');
    expect(urls.news).toContain('localhost');
    expect(urls.sports).toContain('localhost');
    expect(urls.odds).toContain('localhost');
  });
});
