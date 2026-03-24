-- ════════════════════════════════════════════════════════════════
-- FireData · API Keys Migration
-- ════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE api_keys (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key_hash        TEXT NOT NULL UNIQUE,
  key_prefix      TEXT NOT NULL,
  owner           TEXT NOT NULL,
  rate_limit      INT NOT NULL DEFAULT 100,
  rate_window_ms  INT NOT NULL DEFAULT 60000,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  usage_count     BIGINT NOT NULL DEFAULT 0,
  last_used_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_keys_hash ON api_keys (key_hash);
CREATE INDEX idx_api_keys_owner ON api_keys (owner);
CREATE INDEX idx_api_keys_active ON api_keys (is_active);

COMMIT;
