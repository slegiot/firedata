FROM node:22-alpine
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# Copy workspace config
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json tsconfig.base.json ./

# Copy all packages and this service
COPY packages packages
COPY services/news-service services/news-service

# Install all deps
RUN pnpm install --frozen-lockfile

EXPOSE 3003
CMD ["pnpm", "--filter", "@firedata/news-service", "exec", "tsx", "src/server.ts"]
