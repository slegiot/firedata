-- ════════════════════════════════════════════════════════════════
-- FireData · Initial Schema Migration
-- ════════════════════════════════════════════════════════════════
--
-- This migration creates the complete normalized schema for all
-- four data verticals: Finance, News, Sports, and Betting Odds.
--
-- Run: psql $DATABASE_URL -f migrations/001_initial_schema.sql
-- ════════════════════════════════════════════════════════════════

BEGIN;

-- ── Extensions ──────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ══════════════════════════════════════════════════════════════
-- 1. FINANCE
-- ══════════════════════════════════════════════════════════════

CREATE TYPE asset_type AS ENUM ('equity', 'etf', 'crypto');

CREATE TABLE assets (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol        TEXT NOT NULL,
  asset_type    asset_type NOT NULL,
  exchange      TEXT,
  name          TEXT NOT NULL,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (symbol, asset_type, exchange)
);

CREATE INDEX idx_assets_symbol ON assets (symbol);
CREATE INDEX idx_assets_type ON assets (asset_type);

CREATE TABLE asset_price_snapshots (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id      UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  source        TEXT NOT NULL,
  timestamp     TIMESTAMPTZ NOT NULL,
  open          NUMERIC(20, 8),
  high          NUMERIC(20, 8),
  low           NUMERIC(20, 8),
  close         NUMERIC(20, 8) NOT NULL,
  volume        NUMERIC(24, 4),
  raw           JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_price_snapshots_asset_ts ON asset_price_snapshots (asset_id, timestamp DESC);
CREATE INDEX idx_price_snapshots_source ON asset_price_snapshots (source);

CREATE TABLE asset_fundamentals (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id      UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  source        TEXT NOT NULL,
  period        TEXT NOT NULL,       -- e.g. 'quarterly', 'annual', 'ttm'
  period_start  DATE NOT NULL,
  period_end    DATE NOT NULL,
  data          JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (asset_id, source, period, period_start)
);

CREATE INDEX idx_fundamentals_asset ON asset_fundamentals (asset_id, period_end DESC);

-- ══════════════════════════════════════════════════════════════
-- 2. NEWS
-- ══════════════════════════════════════════════════════════════

CREATE TABLE news_articles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source        TEXT NOT NULL,
  url           TEXT NOT NULL UNIQUE,
  title         TEXT NOT NULL,
  summary       TEXT,
  body          TEXT,
  language      TEXT DEFAULT 'en',
  category      TEXT,                -- e.g. 'finance', 'sports', 'general', 'tech'
  published_at  TIMESTAMPTZ,
  scraped_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw           JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_articles_source ON news_articles (source);
CREATE INDEX idx_articles_category ON news_articles (category);
CREATE INDEX idx_articles_published ON news_articles (published_at DESC);
CREATE INDEX idx_articles_scraped ON news_articles (scraped_at DESC);

CREATE TABLE news_tags (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL UNIQUE
);

CREATE TABLE news_article_tags (
  article_id    UUID NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
  tag_id        UUID NOT NULL REFERENCES news_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

CREATE INDEX idx_article_tags_tag ON news_article_tags (tag_id);

-- ══════════════════════════════════════════════════════════════
-- 3. SPORTS
-- ══════════════════════════════════════════════════════════════

CREATE TABLE sports (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key           TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL
);

-- Seed the 10 supported sports
INSERT INTO sports (key, name) VALUES
  ('soccer', 'Soccer'),
  ('cricket', 'Cricket'),
  ('basketball', 'Basketball'),
  ('hockey', 'Hockey'),
  ('tennis', 'Tennis'),
  ('volleyball', 'Volleyball'),
  ('table_tennis', 'Table Tennis'),
  ('baseball', 'Baseball'),
  ('golf', 'Golf'),
  ('american_football', 'American Football');

CREATE TABLE leagues (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sport_id      UUID NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  country       TEXT,
  level         INT DEFAULT 1,       -- 1 = top flight, 2 = second tier, etc.
  external_ids  JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sport_id, name, country)
);

CREATE INDEX idx_leagues_sport ON leagues (sport_id);

CREATE TABLE teams (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id     UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  short_name    TEXT,
  external_ids  JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (league_id, name)
);

CREATE INDEX idx_teams_league ON teams (league_id);

CREATE TABLE players (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id       UUID REFERENCES teams(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  position      TEXT,
  external_ids  JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_players_team ON players (team_id);

CREATE TYPE game_status AS ENUM (
  'scheduled', 'live', 'completed', 'postponed', 'cancelled'
);

CREATE TABLE games (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id     UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  home_team_id  UUID REFERENCES teams(id) ON DELETE SET NULL,
  away_team_id  UUID REFERENCES teams(id) ON DELETE SET NULL,
  start_time    TIMESTAMPTZ NOT NULL,
  status        game_status NOT NULL DEFAULT 'scheduled',
  score         JSONB DEFAULT '{}',   -- { home: 2, away: 1, periods: [...] }
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_games_league ON games (league_id);
CREATE INDEX idx_games_start ON games (start_time DESC);
CREATE INDEX idx_games_status ON games (status);
CREATE INDEX idx_games_teams ON games (home_team_id, away_team_id);

-- ══════════════════════════════════════════════════════════════
-- 4. BETTING ODDS
-- ══════════════════════════════════════════════════════════════

CREATE TABLE bookmakers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL UNIQUE,
  country       TEXT,
  url           TEXT,
  external_rank INT,                  -- popularity/size ranking
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE markets (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sport_id      UUID NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
  key           TEXT NOT NULL,        -- e.g. 'match_winner_1x2', 'over_under_total'
  name          TEXT NOT NULL,
  UNIQUE (sport_id, key)
);

CREATE INDEX idx_markets_sport ON markets (sport_id);

CREATE TABLE odds_snapshots (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bookmaker_id  UUID NOT NULL REFERENCES bookmakers(id) ON DELETE CASCADE,
  game_id       UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  market_id     UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  captured_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  odds          JSONB NOT NULL,       -- { home: 1.85, draw: 3.40, away: 4.20 }
  raw           JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_odds_game ON odds_snapshots (game_id, captured_at DESC);
CREATE INDEX idx_odds_bookmaker ON odds_snapshots (bookmaker_id);
CREATE INDEX idx_odds_market ON odds_snapshots (market_id);
CREATE INDEX idx_odds_captured ON odds_snapshots (captured_at DESC);

-- ── Updated-at trigger ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

COMMIT;
