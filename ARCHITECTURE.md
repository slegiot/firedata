# FireData — Unified Data Provider Platform

## 1. Overview

FireData is a multi-vertical data aggregation and serving platform. It fetches, normalises, caches, and exposes data from hundreds of upstream sources through a single, key-authenticated REST API.

| Vertical | Examples |
|---|---|
| **Finance** | Equities quotes, crypto OHLCV, basic fundamentals |
| **News** | General headlines, finance-filtered, sports-filtered |
| **Sports** | Live scores, fixtures, standings for 10 sports |
| **Betting Odds** | Pre-match & in-play odds from ~20 top sportsbooks |

---

## 2. High-Level Architecture

```
                        ┌──────────────────────┐
                        │     Consumers         │
                        │  (Apps, Dashboards)   │
                        └──────────┬───────────┘
                                   │  HTTPS / REST
                        ┌──────────▼───────────┐
                        │   api-gateway         │
                        │  (Auth · Rate-limit   │
                        │   Routing · Metering) │
                        └──┬───┬───┬───┬───────┘
                           │   │   │   │
              ┌────────────┘   │   │   └────────────┐
              ▼                ▼   ▼                ▼
    ┌─────────────┐  ┌────────────┐ ┌───────────┐ ┌────────────────┐
    │ finance-svc │  │ news-svc   │ │ sports-svc│ │ betting-odds-  │
    │             │  │            │ │           │ │ service        │
    └──────┬──────┘  └─────┬──────┘ └─────┬─────┘ └───────┬────────┘
           │               │              │               │
           └───────┬───────┴──────┬───────┴───────┬───────┘
                   ▼              ▼               ▼
            ┌────────────┐ ┌───────────┐  ┌──────────────┐
            │ PostgreSQL │ │   Redis   │  │  Firecrawl   │
            │ (primary)  │ │  (cache)  │  │  (external)  │
            └────────────┘ └───────────┘  └──────────────┘
```

---

## 3. Service Boundaries & Responsibilities

### 3.1 `api-gateway`

The single public entrypoint. No business logic lives here.

| Concern | Detail |
|---|---|
| **Authentication** | Validate `x-api-key` header against `api_keys` table. Reject unknown/revoked keys. |
| **Rate limiting** | Redis sliding-window counter per key. Configurable per plan (free / pro / enterprise). |
| **Usage metering** | Increment per-key request counter in Redis; flush to Postgres periodically for billing/analytics. |
| **Routing** | Proxy requests to downstream services by path prefix (`/v1/finance/*` → `finance-service`, etc.). |
| **Response envelope** | Wrap downstream responses in `{ data, meta: { requestId, timestamp } }`. |

### 3.2 `finance-service`

| Concern | Detail |
|---|---|
| **Equities** | Quotes, daily OHLCV, basic company profile. Sources: upstream REST APIs (e.g. Alpha Vantage, Polygon, Yahoo Finance via Firecrawl). |
| **Crypto** | Current price, 24h stats, OHLCV candles. Sources: CoinGecko, Binance public API. |
| **Fundamentals** | Market cap, P/E, EPS, sector. Sources: API + Firecrawl scraping for gaps. |
| **Workers** | Scheduled jobs (node-cron / BullMQ) that pull data on cadence (1 min crypto, 15 min equities) and upsert to Postgres. |
| **Serving** | Read-through cache (Redis TTL) on top of Postgres for hot paths. |

### 3.3 `news-service`

| Concern | Detail |
|---|---|
| **Ingestion** | Firecrawl for web scraping; upstream APIs (NewsAPI, GNews, etc.) for structured feeds. |
| **Classification** | Tag articles by vertical (`general`, `finance`, `sports`) and sub-topic using keyword/regex rules (LLM enrichment optional later). |
| **Deduplication** | MD5 hash of `(source + title)` stored in `news_articles`; `ON CONFLICT DO NOTHING`. |
| **Endpoints** | `GET /news?vertical=finance&q=tesla&limit=20`, with pagination and date filtering. |

### 3.4 `sports-service`

Covers **10 sports**: Soccer, Cricket, Basketball, Field Hockey, Ice Hockey, Tennis, Volleyball, Table Tennis, Baseball, Golf, American Football.

| Concern | Detail |
|---|---|
| **Data model** | Normalised schema: `sports` → `leagues` → `seasons` → `fixtures` → `scores`. Shared across all sports with sport-specific JSON `metadata` columns where needed. |
| **Sources** | Primary APIs (API-Football, CricketData, ESPN, etc.) + Firecrawl fallback for missing coverage. |
| **Workers** | Per-sport scheduled workers. Live sports poll every 30 s during match windows; historical data daily. |
| **Endpoints** | `/sports/:sport/fixtures`, `/sports/:sport/standings`, `/sports/:sport/live`. |

### 3.5 `betting-odds-service`

| Concern | Detail |
|---|---|
| **Coverage** | Pre-match and in-play odds from ~20 sportsbooks (bet365, DraftKings, FanDuel, Betfair, William Hill, Unibet, etc.). |
| **Sources** | Odds APIs (The Odds API, OddsJam) + Firecrawl for books without APIs. |
| **Schema** | `odds_snapshots` table: `(fixture_id, sportsbook, market, odds_home, odds_draw, odds_away, timestamp)`. Historical snapshots for line-movement tracking. |
| **Workers** | High-frequency polling (1–5 min) for active fixtures; daily for futures / outrights. |
| **Endpoints** | `/odds/:sport/:fixtureId`, `/odds/:sport/best-odds` (cross-book comparison). |

---

## 4. Shared Packages

### `packages/shared-types`

TypeScript type definitions, Zod schemas, and enums shared across all services. No runtime dependencies. Published as a workspace package.

Key exports: `ApiKey`, `Sport`, `Fixture`, `OddsSnapshot`, `NewsArticle`, `EquityQuote`, `CryptoPrice`, `PaginatedResponse<T>`.

### `packages/shared-db`

Postgres connection management, migrations (via **Drizzle ORM** or **Prisma**), and repository helpers.

- Single shared connection pool factory (`createPool(serviceConfig)`)
- Migration runner invoked per-service at start-up
- Each service owns its own schema namespace (e.g. `finance.*`, `sports.*`) to keep boundaries clear

### `packages/shared-cache`

Redis client wrapper (ioredis).

- `CacheClient` class with typed `get<T>` / `set<T>` / `invalidate` helpers
- Built-in TTL strategies: `SHORT` (30 s), `MEDIUM` (5 min), `LONG` (1 h), `DAILY` (24 h)
- Rate-limiter utility (sliding window) used by `api-gateway`

### `packages/shared-firecrawl-client`

HTTP client (undici / axios) pointed at the separately-deployed Firecrawl instance.

- `scrape(url, options)` → structured markdown / JSON
- `crawl(url, options)` → batch crawl with depth control
- Built-in retry, circuit-breaker, and timeout logic
- Zero coupling to Firecrawl internals; communicates only via its REST API

---

## 5. Data Flow

```
 ┌────────────────────────────────────────────────────────────────┐
 │                      INGESTION LAYER                          │
 │                                                               │
 │   ┌──────────┐   ┌──────────────┐  ┌─────────────────────┐   │
 │   │ Upstream  │   │  Firecrawl   │  │  Scheduled Workers  │   │
 │   │ REST APIs │──▶│  (scraping)  │──│  (node-cron/BullMQ) │   │
 │   └──────────┘   └──────────────┘  └──────────┬──────────┘   │
 │                                                │              │
 └────────────────────────────────────────────────│──────────────┘
                                                  │ INSERT / UPSERT
                                                  ▼
 ┌────────────────────────────────────────────────────────────────┐
 │                     PERSISTENCE LAYER                         │
 │                                                               │
 │   ┌────────────────┐              ┌───────────────────────┐   │
 │   │   PostgreSQL   │              │       Redis           │   │
 │   │  (source of    │◀── read ────▶│  (hot cache, rate     │   │
 │   │   truth)       │   through    │   limits, counters)   │   │
 │   └────────────────┘              └───────────────────────┘   │
 │                                                               │
 └───────────────────────────────┬────────────────────────────────┘
                                 │ SELECT (cached)
                                 ▼
 ┌────────────────────────────────────────────────────────────────┐
 │                      SERVING LAYER                            │
 │                                                               │
 │   ┌────────────────┐     ┌────────────────────────────────┐   │
 │   │  api-gateway   │────▶│  finance / news / sports /     │   │
 │   │  (auth, meter) │     │  betting-odds services         │   │
 │   └────────────────┘     └────────────────────────────────┘   │
 │                                                               │
 └───────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                       JSON response
                       to consumer
```

### Flow summary

1. **Workers** inside each service run on a schedule (cron or BullMQ).
2. Workers call **upstream APIs** directly, or ask **Firecrawl** (via `shared-firecrawl-client`) to scrape pages that lack APIs.
3. Raw data is **normalised** and **upserted** into **Postgres** with deduplication.
4. **Read requests** from consumers hit `api-gateway` → downstream service → **Redis cache** (if warm) or **Postgres** (if cold, then populate cache).
5. `api-gateway` handles **auth**, **rate limiting**, and **metering** before proxying.

---

## 6. Auth & Usage Metering (api-gateway)

### API Key model

```
api_keys
├── id            UUID PK
├── key_hash      TEXT UNIQUE (SHA-256 of raw key)
├── owner_email   TEXT
├── plan          ENUM ('free', 'pro', 'enterprise')
├── quota_daily   INT (e.g. 1000, 50000, unlimited)
├── is_active     BOOLEAN
├── created_at    TIMESTAMPTZ
└── revoked_at    TIMESTAMPTZ NULL
```

### Request lifecycle

1. Extract `x-api-key` header.
2. SHA-256 hash → look up in Redis (cached) or Postgres.
3. Check `is_active`, check daily counter < `quota_daily`.
4. Increment counter in Redis (`INCR firedata:usage:{keyId}:{date}`).
5. Proxy request downstream. On response, add `x-ratelimit-remaining` header.
6. Background flush: every 60 s, persist Redis counters to `usage_logs` table.

---

## 7. Deployment Model

### 7.1 Local Development (Docker Compose)

```yaml
# docker-compose.yml (conceptual)
services:
  postgres:
    image: postgres:16-alpine
    ports: ["5432:5432"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  firecrawl:
    image: firecrawl/firecrawl:latest   # or self-hosted build
    ports: ["3002:3002"]

  api-gateway:
    build: ./services/api-gateway
    ports: ["3000:3000"]
    depends_on: [postgres, redis]

  finance-service:
    build: ./services/finance-service
    depends_on: [postgres, redis]

  news-service:
    build: ./services/news-service
    depends_on: [postgres, redis]

  sports-service:
    build: ./services/sports-service
    depends_on: [postgres, redis]

  betting-odds-service:
    build: ./services/betting-odds-service
    depends_on: [postgres, redis]
```

Each service reads `DATABASE_URL`, `REDIS_URL`, and `FIRECRAWL_URL` from env vars (`.env` at root, loaded by docker-compose).

### 7.2 Production (Railway / Generic Cloud)

| Component | Deployment |
|---|---|
| **Postgres** | Railway managed Postgres (or RDS / Supabase) |
| **Redis** | Railway managed Redis (or ElastiCache / Upstash) |
| **Firecrawl** | Separate Railway service (own repo/image) |
| **api-gateway** | Railway service from monorepo (Nixpacks auto-detect) |
| **finance-service** | Railway service (internal networking, no public port) |
| **news-service** | Railway service (internal) |
| **sports-service** | Railway service (internal) |
| **betting-odds-service** | Railway service (internal) |

Only `api-gateway` is publicly exposed. All downstream services communicate over Railway's **private networking** (internal DNS, e.g. `http://finance-service.railway.internal:3000`).

**CI/CD**: Turborepo `--filter` ensures only affected services re-deploy on push.

---

## 8. Proposed Monorepo Folder Structure

```
firedata/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Lint, typecheck, test
│       └── deploy.yml                # Railway / cloud deploy
│
├── docker-compose.yml                # Local dev stack
├── .env.example                      # Template for env vars
├── turbo.json                        # Turborepo pipeline config
├── pnpm-workspace.yaml               # Workspace definition
├── tsconfig.base.json                # Shared TS config
├── package.json                      # Root scripts (dev, lint, build)
│
├── packages/
│   ├── shared-types/
│   │   ├── src/
│   │   │   ├── finance.ts            # EquityQuote, CryptoPrice, etc.
│   │   │   ├── news.ts               # NewsArticle, NewsVertical
│   │   │   ├── sports.ts             # Sport, League, Fixture, Score
│   │   │   ├── betting.ts            # OddsSnapshot, Sportsbook, Market
│   │   │   ├── api.ts                # ApiKey, PaginatedResponse<T>, ErrorResponse
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── shared-db/
│   │   ├── src/
│   │   │   ├── connection.ts         # createPool(), connection config
│   │   │   ├── migrate.ts            # Migration runner
│   │   │   └── index.ts
│   │   ├── migrations/               # Shared baseline migrations
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── shared-cache/
│   │   ├── src/
│   │   │   ├── client.ts             # CacheClient class (ioredis)
│   │   │   ├── rate-limiter.ts       # Sliding window rate limiter
│   │   │   ├── strategies.ts         # TTL presets
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── shared-firecrawl-client/
│       ├── src/
│       │   ├── client.ts             # FirecrawlClient class
│       │   ├── retry.ts              # Retry / circuit-breaker logic
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── services/
│   ├── api-gateway/
│   │   ├── src/
│   │   │   ├── server.ts             # Fastify app bootstrap
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts           # API key validation
│   │   │   │   ├── rate-limit.ts     # Per-key rate limiting
│   │   │   │   └── metering.ts       # Usage counter increment
│   │   │   ├── proxy/
│   │   │   │   └── router.ts         # Path-based proxy to services
│   │   │   └── config.ts             # Service URLs, plans, quotas
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── finance-service/
│   │   ├── src/
│   │   │   ├── server.ts
│   │   │   ├── routes/
│   │   │   │   ├── equities.ts
│   │   │   │   ├── crypto.ts
│   │   │   │   └── fundamentals.ts
│   │   │   ├── workers/
│   │   │   │   ├── equity-worker.ts
│   │   │   │   └── crypto-worker.ts
│   │   │   ├── repositories/
│   │   │   │   ├── equity.repo.ts
│   │   │   │   └── crypto.repo.ts
│   │   │   └── config.ts
│   │   ├── migrations/               # Finance-specific migrations
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── news-service/
│   │   ├── src/
│   │   │   ├── server.ts
│   │   │   ├── routes/
│   │   │   │   └── news.ts
│   │   │   ├── workers/
│   │   │   │   ├── api-worker.ts     # NewsAPI, GNews
│   │   │   │   └── scrape-worker.ts  # Firecrawl
│   │   │   ├── classifier.ts         # Vertical tagging
│   │   │   ├── repositories/
│   │   │   │   └── news.repo.ts
│   │   │   └── config.ts
│   │   ├── migrations/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── sports-service/
│   │   ├── src/
│   │   │   ├── server.ts
│   │   │   ├── routes/
│   │   │   │   ├── fixtures.ts
│   │   │   │   ├── standings.ts
│   │   │   │   └── live.ts
│   │   │   ├── workers/
│   │   │   │   ├── soccer-worker.ts
│   │   │   │   ├── cricket-worker.ts
│   │   │   │   ├── basketball-worker.ts
│   │   │   │   ├── hockey-worker.ts     # Field + Ice combined
│   │   │   │   ├── tennis-worker.ts
│   │   │   │   ├── volleyball-worker.ts
│   │   │   │   ├── table-tennis-worker.ts
│   │   │   │   ├── baseball-worker.ts
│   │   │   │   ├── golf-worker.ts
│   │   │   │   └── football-worker.ts   # American football
│   │   │   ├── repositories/
│   │   │   │   ├── fixture.repo.ts
│   │   │   │   └── standing.repo.ts
│   │   │   └── config.ts
│   │   ├── migrations/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── betting-odds-service/
│       ├── src/
│       │   ├── server.ts
│       │   ├── routes/
│       │   │   ├── odds.ts
│       │   │   └── best-odds.ts
│       │   ├── workers/
│       │   │   ├── odds-worker.ts       # Upstream odds APIs
│       │   │   └── scrape-worker.ts     # Firecrawl for books w/o API
│       │   ├── repositories/
│       │   │   └── odds.repo.ts
│       │   └── config.ts
│       ├── migrations/
│       ├── Dockerfile
│       ├── package.json
│       └── tsconfig.json
│
└── scripts/
    ├── seed.ts                        # Dev seed data
    └── generate-api-key.ts            # CLI helper
```

---

## 9. Key Design Decisions

| Decision | Rationale |
|---|---|
| **Fastify over Express** | Better TypeScript support, built-in schema validation (Ajv), ~2× throughput. |
| **Drizzle ORM** | Lightweight, SQL-first, great TS inference. Prisma is a viable alternative. |
| **Per-service migrations** | Each service owns its schema namespace. Only `shared-db` provides the runner. Services stay independently deployable. |
| **Workers inside services** | Simpler infra (no separate job-runner process). Each service boots its own cron/BullMQ workers alongside its HTTP server. Can split later if load demands. |
| **Firecrawl as external** | No tight coupling. `shared-firecrawl-client` wraps the HTTP API with retries. Firecrawl can be upgraded, replaced, or scaled independently. |
| **Redis read-through cache** | Hot-path reads (live scores, crypto prices) served from cache. Cold-start fills from Postgres. Simple TTL-based invalidation—no complex pub/sub yet. |
| **Path-based gateway routing** | `/v1/finance/*` → finance-service. Simple, debuggable. Can upgrade to service mesh later. |

---

## 10. Future Considerations (Out of Scope Now)

- **WebSocket / SSE** for real-time live scores and price ticks.
- **BullMQ job queues** for long-running Firecrawl crawls (replacing simple cron).
- **LLM enrichment** in news-service for entity extraction and sentiment.
- **Multi-tenant billing** with Stripe integration.
- **gRPC** between internal services for lower latency.
- **OpenTelemetry** distributed tracing across services.
