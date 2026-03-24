FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY packages/shared-cache/package.json packages/shared-cache/package.json
COPY packages/shared-db/package.json packages/shared-db/package.json
COPY packages/shared-firecrawl-client/package.json packages/shared-firecrawl-client/package.json
COPY services/news-service/package.json services/news-service/package.json
RUN pnpm install --frozen-lockfile

COPY tsconfig.base.json ./
COPY packages packages
COPY services/news-service services/news-service
RUN pnpm turbo build --filter=@firedata/news-service

FROM node:22-alpine
WORKDIR /app
COPY --from=base /app /app
EXPOSE 3002
CMD ["node", "services/news-service/dist/server.js"]
