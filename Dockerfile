# ═══════════════════════════════════════════════════════════════════════════════
# OKAR - Dockerfile Simplifié pour Coolify
# Next.js 15 + Prisma + SQLite
# ═══════════════════════════════════════════════════════════════════════════════

FROM node:20-alpine

# Install dependencies
RUN apk add --no-cache libc6-compat openssl curl

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install dependencies and generate Prisma Client
RUN npm install --legacy-peer-deps
RUN npx prisma generate --schema=./prisma/schema.prisma

# Copy source code
COPY . .

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# Create data directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production

# Start command - run migrations then start server
CMD sh -c "npx prisma migrate deploy --schema=./prisma/schema.prisma || true && node .next/standalone/server.js"
