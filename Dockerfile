# ─── LabDeck · production image ─────────────────────────────────────────────
# Build:  docker compose build
# Run:    docker compose up -d

# 1 · install dependencies
FROM oven/bun:1.2 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# 2 · build the Next.js standalone bundle
FROM oven/bun:1.2 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# 3 · slim runtime
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATA_DIR=/app/data \
    NEXT_TELEMETRY_DISABLED=1

# Uses the built-in "node" user (UID/GID 1000, already present in the image).
# On the host run once: chown -R 1000:1000 data backups

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

RUN mkdir -p /app/data && chown -R node:node /app
USER node

VOLUME /app/data
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null 2>&1 || exit 1

CMD ["node", "server.js"]
