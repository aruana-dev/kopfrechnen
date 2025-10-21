# Next.js Standalone + Socket.io für Railway
FROM node:18-alpine AS base

# Installiere Dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Kopiere package files
COPY package.json package-lock.json* ./
RUN npm ci

# Build the app
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable telemetry
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image - Standalone
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Kopiere Standalone Build (enthält .next/standalone/server.js und minimale node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Kopiere Static Files in den richtigen Pfad innerhalb von standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Kopiere Public Files
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Kopiere server-combined.js
COPY --from=builder --chown=nextjs:nodejs /app/server-combined.js ./server-combined.js

# WICHTIG: Kopiere ALLE node_modules für Socket.io (überschreibt die minimalen von standalone)
COPY --from=builder /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Starte den Combined Server
CMD ["node", "server-combined.js"]
