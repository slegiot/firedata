/**
 * Example: Crawling a news site section
 *
 * This crawls BBC News Technology section, following links up to 2 levels
 * deep, returning markdown for each page.
 *
 * Run: npx tsx packages/shared-firecrawl-client/examples/crawl-news.ts
 */
import { FirecrawlClient } from '../src/index.js';

async function main() {
  const client = new FirecrawlClient({
    baseUrl: process.env.FIRECRAWL_BASE_URL ?? 'http://localhost:3002',
    apiKey: process.env.FIRECRAWL_API_KEY,
  });

  console.log('Starting crawl of BBC News Technology section...');

  // Start the crawl and wait for it to complete
  const result = await client.crawlAndWait(
    'https://www.bbc.co.uk/news/technology',
    {
      maxDepth: 2,
      limit: 20,
      includePaths: ['/news/technology*', '/news/articles/*'],
      excludePaths: ['/news/live/*', '/news/av/*'],
      scrapeOptions: {
        formats: ['markdown'],
      },
    },
    3_000, // poll every 3s
    60_000, // timeout after 60s
  );

  console.log(`Crawl ${result.status}: ${result.completed}/${result.total} pages`);

  for (const page of result.data) {
    console.log(`\n── ${page.metadata?.title ?? page.url} ──`);
    console.log(`   URL: ${page.url}`);
    console.log(`   Content length: ${page.markdown?.length ?? 0} chars`);
  }
}

main().catch(console.error);
