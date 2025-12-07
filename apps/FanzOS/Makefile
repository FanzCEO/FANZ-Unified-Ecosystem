# FansLab Platform Makefile
# Simplified build and deployment commands

.PHONY: help install dev build start test clean health setup deploy

# Default target
help:
	@echo "FansLab Platform Build Commands"
	@echo "==============================="
	@echo ""
	@echo "Development:"
	@echo "  make install    - Install all dependencies"
	@echo "  make dev        - Start development server"
	@echo "  make build      - Build for production"
	@echo "  make start      - Start production server"
	@echo ""
	@echo "Database:"
	@echo "  make db-push    - Push schema changes to database"
	@echo "  make db-backup  - Create database backup"
	@echo "  make db-health  - Check database health"
	@echo ""
	@echo "Maintenance:"
	@echo "  make health     - Run comprehensive health check"
	@echo "  make clean      - Clean build artifacts"
	@echo "  make setup      - Initial project setup"
	@echo "  make test       - Run tests (when available)"

# Install dependencies
install:
	@echo "📦 Installing dependencies..."
	npm ci --silent
	@echo "✅ Dependencies installed"

# Development server
dev:
	@echo "🚀 Starting development server..."
	NODE_ENV=development npm run dev

# Production build
build:
	@echo "🔨 Building for production..."
	node scripts/build.js
	@echo "✅ Build completed"

# Production server
start:
	@echo "🚀 Starting production server..."
	NODE_ENV=production npm start

# Database operations
db-push:
	@echo "🗃️ Pushing database schema..."
	npm run db:push

db-backup:
	@echo "💾 Creating database backup..."
	node scripts/database-manager.js backup

db-health:
	@echo "🏥 Checking database health..."
	node scripts/database-manager.js health

db-optimize:
	@echo "⚡ Optimizing database..."
	node scripts/database-manager.js optimize

# Health check
health:
	@echo "🏥 Running health check..."
	node scripts/health-check.js

# Clean build artifacts  
clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf dist/
	rm -rf node_modules/.cache/
	rm -rf logs/*.log
	@echo "✅ Cleanup completed"

# Initial setup
setup:
	@echo "⚙️ Running initial setup..."
	node scripts/setup.js

# Test runner (placeholder)
test:
	@echo "🧪 Running tests..."
	@echo "⚠️ Test suite not configured yet"

# Quick development setup
quick-start: install db-push dev

# Production deployment
deploy: clean install build start

# Full maintenance
maintain: db-backup db-optimize health
	@echo "🎉 Maintenance completed"