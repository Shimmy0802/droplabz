# Multi-stage build: Use pre-built artifacts to avoid registry calls during deployment
# This works around npm registry outages

# Stage 1: Base Node image
FROM node:18-alpine as base

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9.1.3

# Stage 2: Copy pre-built artifacts (skip npm install during deployment)
FROM base as runner

WORKDIR /app

# Copy pre-built Next.js output
COPY apps/web/.next ./apps/web/.next

# Copy source files and configs
COPY apps/web/public ./apps/web/public
COPY apps/web/package.json ./apps/web/
COPY apps/web/next.config.js ./apps/web/
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY .npmrc ./

# Copy pre-installed node_modules (optional but faster)
COPY apps/web/node_modules ./apps/web/node_modules

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start Next.js in production mode
CMD ["node_modules/.bin/next", "start", "-p", "3000"]
