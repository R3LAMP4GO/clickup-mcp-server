# Build stage
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./

RUN npm ci

COPY . .

RUN npm run build

# Production stage
FROM node:20-slim

# better-sqlite3 needs build tools at runtime for native bindings
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    && rm -rf /var/lib/apt/lists/*

RUN addgroup --system mcp && adduser --system --ingroup mcp mcp

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

RUN npm ci --omit=dev

# Data directory for SQLite (mounted as volume)
RUN mkdir -p /app/data && chown -R mcp:mcp /app

USER mcp

ENV DATA_DIR=/app/data
ENV NODE_ENV=production

EXPOSE 3000 3456

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
