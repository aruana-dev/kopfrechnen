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

# Socket.io Dependencies (müssen im root node_modules sein für server-combined.js)
COPY --from=builder /app/node_modules/socket.io ./node_modules/socket.io
COPY --from=builder /app/node_modules/socket.io-parser ./node_modules/socket.io-parser
COPY --from=builder /app/node_modules/engine.io ./node_modules/engine.io
COPY --from=builder /app/node_modules/engine.io-parser ./node_modules/engine.io-parser
COPY --from=builder /app/node_modules/ws ./node_modules/ws
COPY --from=builder /app/node_modules/@socket.io ./node_modules/@socket.io
COPY --from=builder /app/node_modules/cookie ./node_modules/cookie
COPY --from=builder /app/node_modules/cors ./node_modules/cors

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Starte den Combined Server
CMD ["node", "server-combined.js"]
