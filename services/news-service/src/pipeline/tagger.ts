/**
 * Keyword-based auto-tagger.
 *
 * Assigns tags from a dictionary by matching keywords against
 * the article title and body. Falls back to the source category hint.
 */

const TAG_KEYWORDS: Record<string, string[]> = {
  finance: [
    'stock', 'market', 'earnings', 'nyse', 'nasdaq', 'sp500', 's&p',
    'dow jones', 'investor', 'trading', 'dividend', 'ipo', 'merger',
    'acquisition', 'revenue', 'profit', 'gdp', 'inflation', 'fed',
    'interest rate', 'bond', 'treasury', 'wall street', 'bull',
    'bear', 'rally', 'recession', 'etf', 'mutual fund', 'hedge fund',
    'forex', 'commodity', 'oil price', 'gold price',
  ],
  sports: [
    'goal', 'match', 'league', 'championship', 'tournament', 'score',
    'player', 'coach', 'team', 'nfl', 'nba', 'mlb', 'nhl', 'premier league',
    'champions league', 'world cup', 'olympics', 'transfer', 'injury',
    'soccer', 'football', 'basketball', 'cricket', 'tennis', 'f1',
    'grand prix', 'heavyweight', 'knockout', 'medal', 'stadium',
    'playoff', 'semifinals', 'finals', 'referee', 'offside',
  ],
  technology: [
    'ai', 'artificial intelligence', 'machine learning', 'startup',
    'software', 'cloud', 'data', 'cyber', 'hack', 'tech', 'silicon valley',
    'apple', 'google', 'microsoft', 'meta', 'amazon', 'nvidia', 'openai',
    'chip', 'semiconductor', 'quantum', 'robot', 'automation', 'saas',
    'blockchain', 'app', 'developer', 'api', 'open source', 'gpu',
  ],
  politics: [
    'election', 'senate', 'congress', 'president', 'parliament',
    'government', 'legislature', 'vote', 'policy', 'democrat',
    'republican', 'liberal', 'conservative', 'campaign', 'ballot',
    'geopolitical', 'sanction', 'diplomacy', 'treaty', 'nato',
    'united nations', 'eu commission', 'prime minister', 'summit',
  ],
  crypto: [
    'bitcoin', 'ethereum', 'crypto', 'blockchain', 'defi', 'nft',
    'token', 'wallet', 'mining', 'staking', 'altcoin', 'binance',
    'coinbase', 'solana', 'ripple', 'dogecoin', 'stablecoin',
    'smart contract', 'web3', 'dao', 'dex', 'yield', 'airdrop',
  ],
};

/**
 * Detect tags for an article based on title + body keywords.
 * Returns at least the source category hint if no keywords match.
 */
export function detectTags(
  title: string,
  body: string | null,
  categoryHint: string,
): string[] {
  const text = `${title} ${body ?? ''}`.toLowerCase();
  const tags: string[] = [];

  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
    const matched = keywords.some((kw) => text.includes(kw));
    if (matched) tags.push(tag);
  }

  // Fallback: use source category hint if no keyword matches
  if (tags.length === 0 && categoryHint) {
    tags.push(categoryHint);
  }

  return [...new Set(tags)];
}
