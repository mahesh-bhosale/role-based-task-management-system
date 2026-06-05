#!/bin/sh
set -e

echo "⏳ Running database migrations..."
npx prisma migrate deploy

echo "🌱 Seeding database..."
npx tsx prisma/seed.ts || echo "Seed already applied, skipping..."

echo "🚀 Starting server..."
exec node dist/index.js
