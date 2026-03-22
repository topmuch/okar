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
# Database migrations (with local Prisma 6.x)
# ═══════════════════════════════════════════════════════════════════════════════

if [ -f "/app/node_modules/.bin/prisma" ]; then
  echo "🔄 Running Prisma migrations..."
  /app/node_modules/.bin/prisma migrate deploy --schema=/app/prisma/schema.prisma 2>/dev/null || {
    echo "⚠️ Migration skipped or failed, continuing..."
  }
else
  echo "⚠️ Prisma CLI not found, skipping migrations"
fi

echo "✅ Database ready!"
echo "========================================"

# ═══════════════════════════════════════════════════════════════════════════════
# Start Application (execute CMD from Dockerfile)
# ═══════════════════════════════════════════════════════════════════════════════

echo "🌟 Starting Next.js server on port 3000..."

# Execute the CMD passed from Dockerfile
exec "$@"
