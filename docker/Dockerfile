# docker/Dockerfile
# ─── Stage 1: Dependencies ────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Install OS dependencies for native modules (needed for bcrypt, prisma)
RUN apk add --no-cache libc6-compat openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production && \
    npx prisma generate

# ─── Stage 2: Production image ────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache openssl

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 apiuser

# Copy built artifacts
COPY --from=deps --chown=apiuser:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=apiuser:nodejs /app/prisma       ./prisma

COPY --chown=apiuser:nodejs src        ./src
COPY --chown=apiuser:nodejs package.json ./

# Create logs directory
RUN mkdir -p /app/logs && chown apiuser:nodejs /app/logs

USER apiuser

EXPOSE 3000

# Run migrations then start server
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
