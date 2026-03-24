/**
 * Article deduplication utilities.
 *
 * Two layers:
 * 1. URL-based: DB UNIQUE constraint on news_articles.url handles this at insert time.
 * 2. Content hash: SHA-256 of normalized (title + domain) catches re-published articles.
 */
import { createHash } from 'node:crypto';

/**
 * Generate a content hash for dedup purposes.
 * Normalizes the title and extracts the domain to catch the same article
 * re-published under slightly different URLs.
 */
export function contentHash(title: string, url: string): string {
  const domain = extractDomain(url);
  const normalizedTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return createHash('sha256')
    .update(`${normalizedTitle}::${domain}`)
    .digest('hex');
}

/**
 * Check if an article URL already exists in the DB.
 * This is a pre-check — the DB UNIQUE constraint is the real guard.
 */
export async function urlExists(
  db: import('@firedata/shared-db').FireDataDb,
  url: string,
): Promise<boolean> {
  const existing = await db
    .selectFrom('news_articles')
    .select('id')
    .where('url', '=', url)
    .executeTakeFirst();

  return !!existing;
}

/** Extract domain from a URL for content hash normalization. */
function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
