FROM node:20-alpine
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# Copy workspace config
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json tsconfig.base.json ./

# Copy all packages and this service
COPY packages/ packages/
COPY services/news-service/ services/news-service/

# Install all deps (including dev for build)
RUN pnpm install --frozen-lockfile

# Build the service + its workspace dependencies
RUN pnpm turbo build --filter=@firedata/news-service

EXPOSE 3002
CMD ["node", "services/news-service/dist/server.js"]
