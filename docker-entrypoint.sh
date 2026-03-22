#!/bin/sh
set -e

echo "🚀 Starting OKAR Application..."

# ═══════════════════════════════════════════════════════════════════════════════
# Database Setup
# ═══════════════════════════════════════════════════════════════════════════════

echo "📦 Running Prisma migrations..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️ DATABASE_URL not set, using default SQLite path"
  export DATABASE_URL="file:/app/data/okar.db"
fi

# Run Prisma migrations (deploy mode for production)
npx prisma migrate deploy --schema=/app/prisma/schema.prisma

# Generate Prisma Client (in case it wasn't generated)
npx prisma generate --schema=/app/prisma/schema.prisma

echo "✅ Database ready!"

# ═══════════════════════════════════════════════════════════════════════════════
# Seed Database (optional - only if no data exists)
# ═══════════════════════════════════════════════════════════════════════════════

if [ "$SEED_DATABASE" = "true" ]; then
  echo "🌱 Seeding database..."
  npx prisma db seed --schema=/app/prisma/schema.prisma
fi

# ═══════════════════════════════════════════════════════════════════════════════
# Start Application
# ═══════════════════════════════════════════════════════════════════════════════

echo "🌟 Starting Next.js server..."
exec "$@"
