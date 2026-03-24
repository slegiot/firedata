FROM node:20-alpine
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# Copy workspace config
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json tsconfig.base.json ./

# Copy the dashboard app
COPY apps/dashboard/ apps/dashboard/

# Install all deps (including dev for build)
RUN pnpm install --frozen-lockfile

# Build the dashboard
RUN pnpm turbo build --filter=dashboard

# Install serve for static file serving
RUN npm install -g serve

EXPOSE 3000
CMD ["serve", "-s", "apps/dashboard/dist", "-p", "3000"]
