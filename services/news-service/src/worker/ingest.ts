/**
 * News ingestion worker.
 *
 * Pipeline: fetch sources → deduplicate → enrich (tags) → store.
 */
import type { FireDataDb } from '@firedata/shared-db';
import { insertArticle, findOrCreateTag, tagArticle } from '@firedata/shared-db';
import type { NewsSourceConfig } from '../sources/types.js';
import type { NewsSourceRegistry } from '../sources/registry.js';
import { detectTags } from '../pipeline/tagger.js';

export interface IngestionResult {
  total: number;
  inserted: number;
  duplicates: number;
  errors: Array<{ source: string; error: string }>;
}

export async function runNewsIngestion(
  db: FireDataDb,
  registry: NewsSourceRegistry,
  configs: NewsSourceConfig[],
): Promise<IngestionResult> {
  const result: IngestionResult = {
    total: 0,
    inserted: 0,
    duplicates: 0,
    errors: [],
  };

  console.log(`[news-worker] Starting ingestion from ${configs.filter((c) => c.enabled).length} sources...`);

  // Fetch from all sources
  const articles = await registry.fetchAll(configs);
  result.total = articles.length;

  if (articles.length === 0) {
    console.log('[news-worker] No articles fetched.');
    return result;
  }

  console.log(`[news-worker] Fetched ${articles.length} raw articles, processing...`);

  // Process each article: deduplicate (via DB constraint), enrich, store
  for (const raw of articles) {
    try {
      // Detect tags from content
      const tags = detectTags(raw.title, raw.body ?? raw.summary, raw.categoryHint);

      // Insert article (ON CONFLICT url DO NOTHING handles dedup)
      const article = await insertArticle(db, {
        source: raw.sourceName,
        url: raw.url,
        title: raw.title,
        summary: raw.summary,
        body: raw.body,
        language: raw.language,
        category: tags[0] ?? raw.categoryHint,
        published_at: raw.publishedAt?.toISOString() ?? null,
        raw: raw.raw,
      });

      if (!article) {
        // ON CONFLICT DO NOTHING → duplicate
        result.duplicates++;
        continue;
      }

      // Tag the article
      for (const tagName of tags) {
        const tag = await findOrCreateTag(db, tagName);
        await tagArticle(db, article.id, tag.id);
      }

      result.inserted++;
    } catch (err) {
      result.errors.push({
        source: raw.sourceName,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  console.log(
    `[news-worker] Ingestion complete: ${result.inserted} inserted, ${result.duplicates} duplicates, ${result.errors.length} errors`,
  );

  return result;
}
