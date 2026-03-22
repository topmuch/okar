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
# Start Application First (migrations can fail, app should still start)
# ═══════════════════════════════════════════════════════════════════════════════

echo "🌟 Starting Next.js server on port 3000..."
echo "========================================"

# Start the server in background
node server.js &

# Wait for server to be ready
sleep 5

# ═══════════════════════════════════════════════════════════════════════════════
# Database migrations (after server starts, non-blocking)
# ═══════════════════════════════════════════════════════════════════════════════

# Try to run migrations with local Prisma (version 6.x)
if [ -f "/app/node_modules/.bin/prisma" ]; then
  echo "🔄 Running Prisma migrations with local version..."
  /app/node_modules/.bin/prisma migrate deploy --schema=/app/prisma/schema.prisma 2>/dev/null || {
    echo "⚠️ Migration failed, database might already be up to date"
  }
fi

# Keep the server running
wait
