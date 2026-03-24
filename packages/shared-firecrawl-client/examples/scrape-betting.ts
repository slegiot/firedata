/**
 * Example: Scraping a betting site odds page
 *
 * This scrapes a betting site with a proxy override, useful for sites
 * that geo-restrict or block datacenter IPs.
 *
 * Run: npx tsx packages/shared-firecrawl-client/examples/scrape-betting.ts
 */
import { FirecrawlClient } from '../src/index.js';

async function main() {
  const client = new FirecrawlClient({
    baseUrl: process.env.FIRECRAWL_BASE_URL ?? 'http://localhost:3002',
    apiKey: process.env.FIRECRAWL_API_KEY,
    // Default proxy for all betting-related scrapes
    defaultProxy: process.env.BETTING_PROXY_URL,
  });

  console.log('Scraping betting odds page (with proxy)...');

  const result = await client.scrape(
    'https://www.bet365.com/sports/soccer',
    {
      formats: ['markdown', 'html'],
      // Wait for dynamic odds to load (JS-rendered content)
      waitFor: '.odds-container',
      timeout: 20_000,
      // Per-call proxy override (takes precedence over defaultProxy)
      proxy: process.env.BETTING_PROXY_URL_RESIDENTIAL,
    },
  );

  if (result.success) {
    const { data } = result;
    console.log(`Title:    ${data.metadata.title}`);
    console.log(`Status:   ${data.metadata.statusCode}`);
    console.log(`HTML len: ${data.html?.length ?? 0} chars`);
    console.log(`Markdown: ${data.markdown?.slice(0, 500)}...`);
  } else {
    console.error('Scrape failed:', result);
  }
}

main().catch(console.error);
