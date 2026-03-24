/**
 * Example: Scraping a single finance article
 *
 * This scrapes a Yahoo Finance article and extracts the markdown content
 * plus page metadata (title, description, og:image).
 *
 * Run: npx tsx packages/shared-firecrawl-client/examples/scrape-finance.ts
 */
import { FirecrawlClient } from '../src/index.js';

async function main() {
  const client = FirecrawlClient.fromEnv();

  console.log('Scraping Yahoo Finance article...');

  const result = await client.scrape(
    'https://finance.yahoo.com/news/',
    {
      formats: ['markdown', 'links'],
      timeout: 15_000,
      // Custom headers to appear as a regular browser
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    },
  );

  if (result.success) {
    const { data } = result;
    console.log(`Title:       ${data.metadata.title}`);
    console.log(`Description: ${data.metadata.description}`);
    console.log(`Status:      ${data.metadata.statusCode}`);
    console.log(`Markdown:    ${data.markdown?.slice(0, 500)}...`);
    console.log(`Links found: ${data.links?.length ?? 0}`);
  } else {
    console.error('Scrape failed:', result);
  }
}

main().catch(console.error);
