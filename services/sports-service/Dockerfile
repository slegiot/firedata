FROM node:20-alpine
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# Copy workspace config
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json tsconfig.base.json ./

# Copy all packages and this service
COPY packages/ packages/
COPY services/sports-service/ services/sports-service/

# Install all deps (including dev for build)
RUN pnpm install --frozen-lockfile

# Build the service + its workspace dependencies
RUN pnpm turbo build --filter=@firedata/sports-service

EXPOSE 3003
CMD ["node", "services/sports-service/dist/server.js"]
