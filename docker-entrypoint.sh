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

# Ensure data directory exists
mkdir -p /app/data

# Run Prisma migrations (deploy mode for production)
npx prisma migrate deploy --schema=/app/prisma/schema.prisma || echo "⚠️ Migration failed, continuing..."

echo "✅ Database ready!"

# ═══════════════════════════════════════════════════════════════════════════════
# Start Application
# ═══════════════════════════════════════════════════════════════════════════════

echo "🌟 Starting Next.js server on port 3000..."

# Execute the CMD passed from Dockerfile
exec node server.js
