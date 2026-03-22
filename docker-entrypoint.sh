#!/bin/sh
set -e

echo "========================================"
echo "🚀 Starting OKAR Application..."
echo "========================================"

# ═══════════════════════════════════════════════════════════════════════════════
# Environment Setup
# ═══════════════════════════════════════════════════════════════════════════════

# Set default DATABASE_URL if not provided
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️ DATABASE_URL not set, using default SQLite path"
  export DATABASE_URL="file:/app/data/okar.db"
fi

echo "📦 Database URL: $DATABASE_URL"

# Ensure data directory exists
mkdir -p /app/data

# ═══════════════════════════════════════════════════════════════════════════════
# Database Setup
# ═══════════════════════════════════════════════════════════════════════════════

# Run Prisma migrations if Prisma CLI exists
if [ -f "/app/node_modules/prisma/build/index.js" ]; then
  echo "🔄 Running Prisma migrations..."
  node /app/node_modules/prisma/build/index.js migrate deploy --schema=/app/prisma/schema.prisma 2>&1 || {
    echo "⚠️ Migration skipped, continuing..."
  }
elif [ -f "/app/node_modules/.bin/prisma" ]; then
  echo "🔄 Running Prisma migrations..."
  /app/node_modules/.bin/prisma migrate deploy --schema=/app/prisma/schema.prisma 2>&1 || {
    echo "⚠️ Migration skipped, continuing..."
  }
else
  echo "⚠️ Prisma CLI not found, skipping migrations"
fi

echo "✅ Database ready!"
echo "========================================"

# ═══════════════════════════════════════════════════════════════════════════════
# Start Application
# ═══════════════════════════════════════════════════════════════════════════════

echo "🌟 Starting Next.js server..."
echo "   PORT: $PORT"
echo "   HOSTNAME: $HOSTNAME"

# Execute the CMD passed from Dockerfile
exec "$@"
