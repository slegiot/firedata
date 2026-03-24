// ─── Finance ────────────────────────────────────────────

export interface EquityQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  timestamp: string;
}

export interface CryptoPrice {
  symbol: string;
  name: string;
  priceUsd: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  timestamp: string;
}

// ─── News ───────────────────────────────────────────────

export type NewsVertical = 'general' | 'finance' | 'sports';

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  vertical: NewsVertical;
  publishedAt: string;
  scrapedAt: string;
}

// ─── Sports ─────────────────────────────────────────────

export type Sport =
  | 'soccer'
  | 'cricket'
  | 'basketball'
  | 'field-hockey'
  | 'ice-hockey'
  | 'tennis'
  | 'volleyball'
  | 'table-tennis'
  | 'baseball'
  | 'golf'
  | 'american-football';

export interface League {
  id: string;
  sport: Sport;
  name: string;
  country: string;
}

export interface Fixture {
  id: string;
  sport: Sport;
  leagueId: string;
  homeTeam: string;
  awayTeam: string;
  status: 'scheduled' | 'live' | 'finished' | 'postponed';
  startTime: string;
  scoreHome?: number;
  scoreAway?: number;
  metadata?: Record<string, unknown>;
}

// ─── Betting ────────────────────────────────────────────

export interface OddsSnapshot {
  fixtureId: string;
  sportsbook: string;
  market: string;
  oddsHome: number;
  oddsDraw?: number;
  oddsAway: number;
  timestamp: string;
}

// ─── API ────────────────────────────────────────────────

export interface ApiKey {
  id: string;
  keyHash: string;
  ownerEmail: string;
  plan: 'free' | 'pro' | 'enterprise';
  quotaDaily: number;
  isActive: boolean;
  createdAt: string;
  revokedAt?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    requestId: string;
    timestamp: string;
  };
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    requestId: string;
  };
}

export interface HealthResponse {
  status: 'ok';
  service: string;
  uptime: number;
  timestamp: string;
}
