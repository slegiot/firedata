/**
 * News query helpers.
 */
import type { FireDataDb } from '../db.js';
import type { NewNewsArticle, NewNewsTag } from '../schema.js';

/** Insert a news article, ignoring duplicates by URL. */
export async function insertArticle(db: FireDataDb, article: NewNewsArticle) {
  return db
    .insertInto('news_articles')
    .values(article)
    .onConflict((oc) => oc.column('url').doNothing())
    .returningAll()
    .executeTakeFirst();
}

/** Bulk insert articles, skipping duplicates. */
export async function insertArticles(db: FireDataDb, articles: NewNewsArticle[]) {
  if (articles.length === 0) return [];

  return db
    .insertInto('news_articles')
    .values(articles)
    .onConflict((oc) => oc.column('url').doNothing())
    .returningAll()
    .execute();
}

/** Get articles by category, most recent first. */
export async function getArticlesByCategory(
  db: FireDataDb,
  category: string,
  limit = 50,
) {
  return db
    .selectFrom('news_articles')
    .selectAll()
    .where('category', '=', category)
    .orderBy('published_at', 'desc')
    .limit(limit)
    .execute();
}

/** Get the most recent articles across all categories. */
export async function getRecentArticles(db: FireDataDb, limit = 50) {
  return db
    .selectFrom('news_articles')
    .selectAll()
    .orderBy('published_at', 'desc')
    .limit(limit)
    .execute();
}

/** Find or create a tag by name. */
export async function findOrCreateTag(db: FireDataDb, name: string) {
  return db
    .insertInto('news_tags')
    .values({ name })
    .onConflict((oc) => oc.column('name').doNothing())
    .returningAll()
    .executeTakeFirst()
    ?? db
      .selectFrom('news_tags')
      .selectAll()
      .where('name', '=', name)
      .executeTakeFirstOrThrow();
}

/** Tag an article. */
export async function tagArticle(db: FireDataDb, articleId: string, tagId: string) {
  return db
    .insertInto('news_article_tags')
    .values({ article_id: articleId, tag_id: tagId })
    .onConflict((oc) => oc.columns(['article_id', 'tag_id']).doNothing())
    .execute();
}

/** Get articles by tag name. */
export async function getArticlesByTag(db: FireDataDb, tagName: string, limit = 50) {
  return db
    .selectFrom('news_articles')
    .innerJoin('news_article_tags', 'news_articles.id', 'news_article_tags.article_id')
    .innerJoin('news_tags', 'news_tags.id', 'news_article_tags.tag_id')
    .selectAll('news_articles')
    .where('news_tags.name', '=', tagName)
    .orderBy('news_articles.published_at', 'desc')
    .limit(limit)
    .execute();
}
