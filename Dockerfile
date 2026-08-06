# syntax=docker/dockerfile:1

# --- deps: install dependencies only (cached separately from source changes) ---
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- builder: full source + build ---
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build-time-only values (baked into the client bundle). Runtime secrets
# (API keys, tokens) are passed as real env vars at `docker run` /
# compose time instead — see docker-compose.yml.
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY
RUN npm run build

# --- runner: minimal production image ---
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# `output: "standalone"` in next.config.ts traces exactly the files
# needed at runtime (including data/*.json, since history-db.ts
# references it with a literal path segment) — everything else (dev
# deps, unused node_modules, source) is left behind in the builder stage.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
