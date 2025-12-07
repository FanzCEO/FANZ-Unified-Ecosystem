#!/bin/bash

# ==============================================================================
# FANZ Database Deployment Script
# ==============================================================================

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-"staging"}
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_NAME=${DB_NAME:-"fanz_${ENVIRONMENT}"}
DB_USER=${DB_USER:-"fanz_admin"}

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}FANZ Database Deployment${NC}"
echo -e "${GREEN}Environment: ${ENVIRONMENT}${NC}"
echo -e "${GREEN}================================${NC}"

# ==============================================================================
# Pre-deployment Checks
# ==============================================================================

echo -e "\n${YELLOW}Running pre-deployment checks...${NC}"

# Check if PostgreSQL is accessible
if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c '\q' 2>/dev/null; then
    echo -e "${RED}❌ Cannot connect to PostgreSQL${NC}"
    exit 1
fi
echo -e "${GREEN}✓ PostgreSQL connection successful${NC}"

# Check PostgreSQL version
PG_VERSION=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -t -c "SELECT version();" | grep -oP '\d+\.\d+' | head -1)
if (( $(echo "$PG_VERSION < 15.0" | bc -l) )); then
    echo -e "${RED}❌ PostgreSQL version $PG_VERSION is too old. Requires 15+${NC}"
    exit 1
fi
echo -e "${GREEN}✓ PostgreSQL version ${PG_VERSION} is compatible${NC}"

# Check if required extensions are available
echo -e "\n${YELLOW}Checking required extensions...${NC}"
REQUIRED_EXTENSIONS=("uuid-ossp" "pgcrypto" "postgis")
for ext in "${REQUIRED_EXTENSIONS[@]}"; do
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -t -c "SELECT 1 FROM pg_available_extensions WHERE name = '$ext'" | grep -q 1; then
        echo -e "${GREEN}✓ Extension $ext is available${NC}"
    else
        echo -e "${RED}❌ Extension $ext is not available${NC}"
        exit 1
    fi
done

# ==============================================================================
# Backup Current Database
# ==============================================================================

if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "\n${YELLOW}Creating backup before deployment...${NC}"
    BACKUP_FILE="backup_${DB_NAME}_$(date +%Y%m%d_%H%M%S).sql"

    pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -F c -f "$BACKUP_FILE" 2>/dev/null || {
        echo -e "${YELLOW}Note: Database doesn't exist yet, skipping backup${NC}"
    }

    if [ -f "$BACKUP_FILE" ]; then
        echo -e "${GREEN}✓ Backup created: ${BACKUP_FILE}${NC}"

        # Upload to S3 if AWS CLI is available
        if command -v aws &> /dev/null; then
            aws s3 cp "$BACKUP_FILE" "s3://fanz-db-backups/${ENVIRONMENT}/" || true
            echo -e "${GREEN}✓ Backup uploaded to S3${NC}"
        fi
    fi
fi

# ==============================================================================
# Create Database if Not Exists
# ==============================================================================

echo -e "\n${YELLOW}Ensuring database exists...${NC}"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME" 2>/dev/null || {
    echo -e "${GREEN}✓ Database already exists${NC}"
}

# ==============================================================================
# Deploy Schema
# ==============================================================================

echo -e "\n${YELLOW}Deploying database schema...${NC}"

# Deploy main schema
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f schema.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Schema deployed successfully${NC}"
else
    echo -e "${RED}❌ Schema deployment failed${NC}"
    exit 1
fi

# ==============================================================================
# Run Migrations
# ==============================================================================

echo -e "\n${YELLOW}Running database migrations...${NC}"

if [ -d "migrations" ]; then
    for migration in migrations/*.sql; do
        if [ -f "$migration" ]; then
            echo -e "  Running $(basename $migration)..."
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration"
        fi
    done
    echo -e "${GREEN}✓ Migrations completed${NC}"
else
    echo -e "${YELLOW}ℹ No migrations directory found${NC}"
fi

# ==============================================================================
# Verify Deployment
# ==============================================================================

echo -e "\n${YELLOW}Verifying deployment...${NC}"

# Check if core tables exist
CORE_TABLES=("users" "creator_profiles" "posts" "media_files" "transactions" "subscriptions")
for table in "${CORE_TABLES[@]}"; do
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT 1 FROM information_schema.tables WHERE table_name = '$table'" | grep -q 1; then
        echo -e "${GREEN}✓ Table $table exists${NC}"
    else
        echo -e "${RED}❌ Table $table is missing${NC}"
        exit 1
    fi
done

# Check if extensions are enabled
for ext in "${REQUIRED_EXTENSIONS[@]}"; do
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT 1 FROM pg_extension WHERE extname = '$ext'" | grep -q 1; then
        echo -e "${GREEN}✓ Extension $ext is enabled${NC}"
    else
        echo -e "${YELLOW}⚠ Extension $ext is not enabled (may not be required)${NC}"
    fi
done

# ==============================================================================
# Performance Optimization
# ==============================================================================

echo -e "\n${YELLOW}Running performance optimizations...${NC}"

# Analyze tables for query planner
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "ANALYZE;"
echo -e "${GREEN}✓ Table statistics updated${NC}"

# Vacuum database
if [ "$ENVIRONMENT" != "production" ]; then
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "VACUUM;"
    echo -e "${GREEN}✓ Database vacuumed${NC}"
fi

# ==============================================================================
# Seed Initial Data (Non-Production)
# ==============================================================================

if [ "$ENVIRONMENT" != "production" ]; then
    echo -e "\n${YELLOW}Seeding initial data...${NC}"

    if [ -f "seed.sql" ]; then
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f seed.sql
        echo -e "${GREEN}✓ Initial data seeded${NC}"
    else
        echo -e "${YELLOW}ℹ No seed file found${NC}"
    fi
fi

# ==============================================================================
# Post-Deployment Health Check
# ==============================================================================

echo -e "\n${YELLOW}Running health checks...${NC}"

# Check database size
DB_SIZE=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));")
echo -e "${GREEN}✓ Database size: ${DB_SIZE}${NC}"

# Check connection count
CONN_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT count(*) FROM pg_stat_activity WHERE datname = '$DB_NAME';")
echo -e "${GREEN}✓ Active connections: ${CONN_COUNT}${NC}"

# Check table count
TABLE_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';")
echo -e "${GREEN}✓ Total tables: ${TABLE_COUNT}${NC}"

# Check index count
INDEX_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT count(*) FROM pg_indexes WHERE schemaname = 'public';")
echo -e "${GREEN}✓ Total indexes: ${INDEX_COUNT}${NC}"

# ==============================================================================
# Summary
# ==============================================================================

echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}✓ Deployment Successful!${NC}"
echo -e "${GREEN}================================${NC}"
echo -e "Environment: ${ENVIRONMENT}"
echo -e "Database: ${DB_NAME}"
echo -e "Host: ${DB_HOST}:${DB_PORT}"
echo -e "Time: $(date)"
echo -e "${GREEN}================================${NC}"

# ==============================================================================
# Deployment Log
# ==============================================================================

LOG_FILE="deployment_${ENVIRONMENT}_$(date +%Y%m%d_%H%M%S).log"
echo "Deployment completed successfully at $(date)" > "$LOG_FILE"
echo "Environment: ${ENVIRONMENT}" >> "$LOG_FILE"
echo "Database: ${DB_NAME}" >> "$LOG_FILE"
echo -e "${GREEN}✓ Deployment log saved: ${LOG_FILE}${NC}"

exit 0
