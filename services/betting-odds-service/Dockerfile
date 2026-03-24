FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY packages/shared-cache/package.json packages/shared-cache/package.json
COPY packages/shared-db/package.json packages/shared-db/package.json
COPY packages/shared-firecrawl-client/package.json packages/shared-firecrawl-client/package.json
COPY services/betting-odds-service/package.json services/betting-odds-service/package.json
RUN pnpm install --frozen-lockfile

COPY tsconfig.base.json ./
COPY packages packages
COPY services/betting-odds-service services/betting-odds-service
RUN pnpm turbo build --filter=@firedata/betting-odds-service

FROM node:22-alpine
WORKDIR /app
COPY --from=base /app /app
EXPOSE 3004
CMD ["node", "services/betting-odds-service/dist/server.js"]
