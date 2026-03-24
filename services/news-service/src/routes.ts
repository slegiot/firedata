/**
 * News REST API routes.
 *
 * - GET /v1/news                — list articles (cursor pagination + category filter)
 * - GET /v1/news/:id            — single article with tags
 * - GET /v1/news/search         — full-text search on title/summary
 */
import type { FastifyInstance } from 'fastify';
import type { FireDataDb } from '@firedata/shared-db';

export async function registerRoutes(
  app: FastifyInstance,
  db: FireDataDb,
): Promise<void> {
  // ── GET /v1/news ──────────────────────────────────────────

  app.get<{
    Querystring: {
      category?: string;
      limit?: string;
      cursor?: string;
    };
  }>('/v1/news', async (request, reply) => {
    const { category, limit: limitStr, cursor } = request.query;
    const limit = Math.min(Number(limitStr) || 50, 200);

    let query = db
      .selectFrom('news_articles')
      .selectAll()
      .orderBy('published_at', 'desc')
      .orderBy('created_at', 'desc')
      .limit(limit + 1); // Fetch one extra to determine hasMore

    if (category) {
      query = query.where('category', '=', category);
    }

    if (cursor) {
      // Cursor is the `created_at` ISO string of the last item
      query = query.where('created_at', '<', new Date(cursor));
    }

    const rows = await query.execute();
    const hasMore = rows.length > limit;
    const articles = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore
      ? articles[articles.length - 1].created_at.toISOString()
      : null;

    return reply.send({
      data: articles,
      count: articles.length,
      cursor: nextCursor,
    });
  });

  // ── GET /v1/news/search ───────────────────────────────────
  // Must be registered BEFORE /v1/news/:id to avoid route conflict

  app.get<{
    Querystring: {
      q: string;
      category?: string;
      from?: string;
      to?: string;
      limit?: string;
    };
  }>('/v1/news/search', async (request, reply) => {
    const { q, category, from, to, limit: limitStr } = request.query;

    if (!q || q.trim().length < 2) {
      return reply.status(400).send({ error: 'Query "q" must be at least 2 characters' });
    }

    const limit = Math.min(Number(limitStr) || 50, 200);
    const searchTerm = `%${q.trim()}%`;

    let query = db
      .selectFrom('news_articles')
      .selectAll()
      .where((eb) =>
        eb.or([
          eb('title', 'ilike', searchTerm),
          eb('summary', 'ilike', searchTerm),
        ]),
      )
      .orderBy('published_at', 'desc')
      .limit(limit);

    if (category) {
      query = query.where('category', '=', category);
    }
    if (from) {
      query = query.where('published_at', '>=', new Date(from));
    }
    if (to) {
      query = query.where('published_at', '<=', new Date(to));
    }

    const articles = await query.execute();

    return reply.send({ data: articles, count: articles.length });
  });

  // ── GET /v1/news/:id ──────────────────────────────────────

  app.get<{
    Params: { id: string };
  }>('/v1/news/:id', async (request, reply) => {
    const { id } = request.params;

    const article = await db
      .selectFrom('news_articles')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!article) {
      return reply.status(404).send({ error: 'Article not found' });
    }

    // Fetch associated tags
    const tags = await db
      .selectFrom('news_article_tags')
      .innerJoin('news_tags', 'news_tags.id', 'news_article_tags.tag_id')
      .select('news_tags.name')
      .where('news_article_tags.article_id', '=', id)
      .execute();

    return reply.send({
      data: {
        ...article,
        tags: tags.map((t) => t.name),
      },
    });
  });
}
