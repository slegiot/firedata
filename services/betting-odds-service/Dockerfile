FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# Install deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY packages/shared-cache/package.json packages/shared-cache/package.json
COPY packages/shared-db/package.json packages/shared-db/package.json
COPY packages/shared-firecrawl-client/package.json packages/shared-firecrawl-client/package.json
COPY services/betting-odds-service/package.json services/betting-odds-service/package.json
RUN pnpm install --frozen-lockfile

# Build
COPY tsconfig.base.json ./
COPY packages/shared-types packages/shared-types
COPY packages/shared-cache packages/shared-cache
COPY packages/shared-db packages/shared-db
COPY packages/shared-firecrawl-client packages/shared-firecrawl-client
COPY services/betting-odds-service services/betting-odds-service
RUN pnpm turbo build --filter=@firedata/betting-odds-service...

# Run
FROM node:22-alpine
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app
COPY --from=base /app /app
EXPOSE 3004
CMD ["node", "services/betting-odds-service/dist/server.js"]
