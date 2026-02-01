#!/bin/bash

# Database Setup Script for DropLabz
# This script starts PostgreSQL via Docker and pushes the Prisma schema

set -e

echo "🗄️  Setting up DropLabz Database..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker first."
  exit 1
fi

# Check if container already exists
if docker ps -a --format '{{.Names}}' | grep -q '^droplabz-db$'; then
  echo "📦 Found existing droplabz-db container"
  
  # Check if it's running
  if docker ps --format '{{.Names}}' | grep -q '^droplabz-db$'; then
    echo "✅ Database is already running"
  else
    echo "🔄 Starting database container..."
    docker start droplabz-db
  fi
else
  echo "📦 Creating new PostgreSQL container..."
  docker run -d \
    --name droplabz-db \
    -e POSTGRES_USER=user \
    -e POSTGRES_PASSWORD=password \
    -e POSTGRES_DB=droplabz \
    -p 5432:5432 \
    postgres:16
  
  echo "⏳ Waiting for PostgreSQL to be ready..."
  sleep 3
fi

echo ""
echo "🔧 Pushing Prisma schema to database..."
cd apps/web
pnpm db:push

echo ""
echo "✅ Database setup complete!"
echo ""
echo "📊 You can now:"
echo "   - View data: cd apps/web && pnpm db:studio"
echo "   - Start dev server: pnpm dev"
echo ""
echo "🔗 Database: postgresql://user:password@localhost:5432/droplabz"
