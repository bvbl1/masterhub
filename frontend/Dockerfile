# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
ENV NODE_OPTIONS="--max-old-space-size=1536"
RUN npm install --no-audit --no-fund

FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* are inlined at `next build` — must be set before npm run build (Railway: service Variables + redeploy).
ARG NEXT_PUBLIC_API_URL=http://localhost:8080/v1
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
ARG NEXT_PUBLIC_TELEGRAM_BOT_URL=
ARG NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=
ARG NEXT_PUBLIC_CHAT_WS_URL=
ARG NEXT_PUBLIC_CHAT_WS_HOST=
ARG NEXT_PUBLIC_CHAT_WS_PORT=
ARG NEXT_PUBLIC_STRIPE_PUBLIC_KEY=
# Legacy name — still passed by some Railway configs until renamed.
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ENV NEXT_PUBLIC_TELEGRAM_BOT_URL=$NEXT_PUBLIC_TELEGRAM_BOT_URL
ENV NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=$NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
ENV NEXT_PUBLIC_CHAT_WS_URL=$NEXT_PUBLIC_CHAT_WS_URL
ENV NEXT_PUBLIC_CHAT_WS_HOST=$NEXT_PUBLIC_CHAT_WS_HOST
ENV NEXT_PUBLIC_CHAT_WS_PORT=$NEXT_PUBLIC_CHAT_WS_PORT
ENV NEXT_PUBLIC_STRIPE_PUBLIC_KEY=$NEXT_PUBLIC_STRIPE_PUBLIC_KEY
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_TELEMETRY_DISABLED=1
# Bound V8 heap so one Node process cannot exhaust Docker’s cgroup memory on small hosts.
# If the build still dies with OOM, raise Docker Desktop memory (e.g. 4–8 GiB) or increase this (e.g. 3072).
ENV NODE_OPTIONS="--max-old-space-size=2048"

RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
