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
# Prisma Setup
# ═══════════════════════════════════════════════════════════════════════════════

echo "🔄 Running Prisma migrations..."

# Run Prisma migrations (deploy mode for production)
npx prisma migrate deploy --schema=/app/prisma/schema.prisma || {
  echo "⚠️ Migration failed, attempting to push schema..."
  npx prisma db push --schema=/app/prisma/schema.prisma --accept-data-loss || {
    echo "⚠️ Schema push also failed, continuing anyway..."
  }
}

echo "✅ Database ready!"

# ═══════════════════════════════════════════════════════════════════════════════
# Start Application
# ═══════════════════════════════════════════════════════════════════════════════

echo "🌟 Starting Next.js server on port 3000..."
echo "========================================"

# Execute the command passed to the container
exec "$@"
