import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FirecrawlClient } from '../src/client.js';
import { FirecrawlError } from '../src/types.js';
import { calculateBackoff, isRetryableError } from '../src/retry.js';

// ── Mock fetch globally ───────────────────────────────────────

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function jsonResponse(data: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as Response;
}

// ── Tests ─────────────────────────────────────────────────────

describe('FirecrawlClient', () => {
  let client: FirecrawlClient;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new FirecrawlClient({
      baseUrl: 'http://firecrawl:3002',
      apiKey: 'test-key',
      maxRetries: 2,
      retryBaseDelayMs: 10, // fast retries for tests
      timeoutMs: 5_000,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── scrape ──────────────────────────────────────────────

  describe('scrape', () => {
    it('sends correct request and returns typed result', async () => {
      const mockResult = {
        success: true,
        data: {
          url: 'https://example.com',
          markdown: '# Hello',
          metadata: { title: 'Example', sourceURL: 'https://example.com', statusCode: 200 },
        },
      };
      mockFetch.mockResolvedValueOnce(jsonResponse(mockResult));

      const result = await client.scrape('https://example.com', {
        formats: ['markdown', 'html'],
        timeout: 10_000,
      });

      expect(result.success).toBe(true);
      expect(result.data.markdown).toBe('# Hello');
      expect(result.data.metadata.title).toBe('Example');

      // Verify request shape
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('http://firecrawl:3002/v1/scrape');
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body)).toMatchObject({
        url: 'https://example.com',
        formats: ['markdown', 'html'],
        timeout: 10_000,
      });
      expect(init.headers['Authorization']).toBe('Bearer test-key');
    });

    it('sends proxy header when proxy option is provided', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ success: true, data: { url: 'https://bet365.com', metadata: {} } }),
      );

      await client.scrape('https://bet365.com', { proxy: 'http://proxy:8080' });

      const [, init] = mockFetch.mock.calls[0];
      expect(init.headers['X-Proxy-URL']).toBe('http://proxy:8080');
    });

    it('uses defaultProxy when no per-call proxy is set', async () => {
      const proxyClient = new FirecrawlClient({
        baseUrl: 'http://firecrawl:3002',
        defaultProxy: 'http://default-proxy:9090',
        maxRetries: 0,
      });

      mockFetch.mockResolvedValueOnce(
        jsonResponse({ success: true, data: { url: 'https://example.com', metadata: {} } }),
      );

      await proxyClient.scrape('https://example.com');

      const [, init] = mockFetch.mock.calls[0];
      expect(init.headers['X-Proxy-URL']).toBe('http://default-proxy:9090');
    });
  });

  // ── crawl ───────────────────────────────────────────────

  describe('crawl', () => {
    it('starts a crawl and returns job ID', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ success: true, id: 'job-123', url: 'https://bbc.co.uk' }),
      );

      const result = await client.crawl('https://bbc.co.uk', {
        maxDepth: 3,
        limit: 10,
        includePaths: ['/news/*'],
      });

      expect(result.id).toBe('job-123');

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.maxDepth).toBe(3);
      expect(body.limit).toBe(10);
      expect(body.includePaths).toEqual(['/news/*']);
    });

    it('checks crawl status via GET', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({
          success: true,
          status: 'completed',
          total: 5,
          completed: 5,
          data: [{ url: 'https://bbc.co.uk/news/1', markdown: '# Article', metadata: {} }],
        }),
      );

      const status = await client.getCrawlStatus('job-123');

      expect(status.status).toBe('completed');
      expect(status.data).toHaveLength(1);

      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('http://firecrawl:3002/v1/crawl/job-123');
      expect(init.method).toBe('GET');
    });
  });

  // ── search ──────────────────────────────────────────────

  describe('search', () => {
    it('sends search query and returns results', async () => {
      const mockResult = {
        success: true,
        data: [
          {
            url: 'https://example.com/result',
            title: 'Search Result',
            description: 'Found it',
            markdown: '# Result',
            metadata: { sourceURL: 'https://example.com/result', statusCode: 200 },
          },
        ],
      };
      mockFetch.mockResolvedValueOnce(jsonResponse(mockResult));

      const result = await client.search('TypeScript monorepo', {
        limit: 3,
        lang: 'en',
        country: 'gb',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('Search Result');

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.query).toBe('TypeScript monorepo');
      expect(body.limit).toBe(3);
      expect(body.lang).toBe('en');
      expect(body.country).toBe('gb');
    });
  });

  // ── Retry logic ─────────────────────────────────────────

  describe('retry logic', () => {
    it('retries on 5xx errors and succeeds', async () => {
      mockFetch
        .mockResolvedValueOnce(jsonResponse({ error: 'overloaded' }, 503))
        .mockResolvedValueOnce(
          jsonResponse({ success: true, data: { url: 'https://example.com', metadata: {} } }),
        );

      const result = await client.scrape('https://example.com');

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('does NOT retry on 4xx errors', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ error: 'bad request' }, 400));

      await expect(client.scrape('https://example.com')).rejects.toThrow(FirecrawlError);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('throws after exhausting retries', async () => {
      mockFetch
        .mockResolvedValue(jsonResponse({ error: 'down' }, 500));

      await expect(client.scrape('https://example.com')).rejects.toThrow(
        /Firecrawl API 500/,
      );
      // initial + 2 retries = 3 attempts
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('retries on network errors (TypeError)', async () => {
      mockFetch
        .mockRejectedValueOnce(new TypeError('fetch failed'))
        .mockResolvedValueOnce(
          jsonResponse({ success: true, data: { url: 'https://example.com', metadata: {} } }),
        );

      const result = await client.scrape('https://example.com');
      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  // ── fromEnv ─────────────────────────────────────────────

  describe('fromEnv', () => {
    it('throws when FIRECRAWL_BASE_URL is not set', () => {
      delete process.env.FIRECRAWL_BASE_URL;
      expect(() => FirecrawlClient.fromEnv()).toThrow('FIRECRAWL_BASE_URL');
    });

    it('creates client from env vars', () => {
      process.env.FIRECRAWL_BASE_URL = 'http://localhost:3002';
      process.env.FIRECRAWL_API_KEY = 'env-key';

      const envClient = FirecrawlClient.fromEnv();
      expect(envClient).toBeInstanceOf(FirecrawlClient);

      delete process.env.FIRECRAWL_BASE_URL;
      delete process.env.FIRECRAWL_API_KEY;
    });
  });
});

// ── Retry utility unit tests ──────────────────────────────────

describe('retry utilities', () => {
  describe('calculateBackoff', () => {
    it('increases delay exponentially', () => {
      // attempt 0: ~1000ms, attempt 1: ~2000ms, attempt 2: ~4000ms
      const d0 = calculateBackoff(0, 1000);
      const d1 = calculateBackoff(1, 1000);
      const d2 = calculateBackoff(2, 1000);

      expect(d0).toBeGreaterThanOrEqual(1000);
      expect(d0).toBeLessThan(1600); // 1000 + up to 500 jitter
      expect(d1).toBeGreaterThanOrEqual(2000);
      expect(d2).toBeGreaterThanOrEqual(4000);
    });

    it('caps at 30 seconds', () => {
      const delay = calculateBackoff(20, 1000);
      expect(delay).toBeLessThanOrEqual(30_000);
    });
  });

  describe('isRetryableError', () => {
    it('returns true for TypeError (network errors)', () => {
      expect(isRetryableError(new TypeError('fetch failed'))).toBe(true);
    });

    it('returns true for 5xx FirecrawlError', () => {
      expect(isRetryableError(new FirecrawlError('error', 503))).toBe(true);
    });

    it('returns false for 4xx FirecrawlError', () => {
      expect(isRetryableError(new FirecrawlError('error', 404))).toBe(false);
    });

    it('returns false for generic errors', () => {
      expect(isRetryableError(new Error('random'))).toBe(false);
    });
  });
});
