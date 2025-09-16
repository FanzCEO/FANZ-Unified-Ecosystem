#!/bin/bash

# 🛡️ FANZ Vendor Access System Setup Script
# 
# This script sets up the vendor access delegation system
# including database migration and seed data creation.

set -e  # Exit on any error

echo "🛡️ FANZ Vendor Access System Setup"
echo "=================================="

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
    echo "✅ Environment variables loaded"
else
    echo "⚠️  No .env file found, using defaults"
fi

# Set default values if not provided
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-fanz_unified}
DB_USER=${DB_USER:-postgres}
VENDOR_JWT_SECRET=${VENDOR_JWT_SECRET:-demo-vendor-jwt-secret-for-development}

echo ""
echo "📋 Configuration:"
echo "   Database: $DB_HOST:$DB_PORT/$DB_NAME"
echo "   User: $DB_USER"
echo "   JWT Secret: ${VENDOR_JWT_SECRET:0:20}..."
echo ""

# Function to check if database is accessible
check_database() {
    echo "🔗 Checking database connection..."
    
    if command -v psql >/dev/null 2>&1; then
        if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
            echo "✅ Database connection successful"
            return 0
        else
            echo "❌ Database connection failed"
            return 1
        fi
    else
        echo "⚠️  psql not found, skipping direct database check"
        return 0
    fi
}

# Function to run database migration
run_migration() {
    echo ""
    echo "📊 Running database migration..."
    
    MIGRATION_FILE="backend/database/migrations/20250916_create_vendor_access_tables.sql"
    
    if [ -f "$MIGRATION_FILE" ]; then
        if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$MIGRATION_FILE" 2>/dev/null; then
            echo "✅ Database migration completed successfully"
        else
            echo "⚠️  Migration may have already been applied or failed"
        fi
    else
        echo "❌ Migration file not found: $MIGRATION_FILE"
        return 1
    fi
}

# Function to seed sample data
seed_data() {
    echo ""
    echo "🌱 Creating seed data..."
    
    if [ -f "backend/scripts/seed-vendor-access.ts" ]; then
        cd backend
        
        # Check if TypeScript is available
        if command -v npx >/dev/null 2>&1; then
            echo "   Running TypeScript seed script..."
            if npx ts-node scripts/seed-vendor-access.ts; then
                echo "✅ Seed data created successfully"
            else
                echo "⚠️  Seed script encountered issues (this may be normal if data already exists)"
            fi
        else
            echo "⚠️  npx/ts-node not available, skipping seed data"
        fi
        
        cd ..
    else
        echo "❌ Seed script not found"
    fi
}

# Function to verify setup
verify_setup() {
    echo ""
    echo "🔍 Verifying setup..."
    
    # Check if vendor tables exist
    if command -v psql >/dev/null 2>&1; then
        VENDOR_TABLES=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE 'vendor_%';" 2>/dev/null || echo "0")
        
        if [ "$VENDOR_TABLES" -ge "7" ]; then
            echo "✅ Vendor access tables found ($VENDOR_TABLES tables)"
        else
            echo "⚠️  Expected vendor tables may be missing (found $VENDOR_TABLES)"
        fi
        
        # Check if sample data exists
        VENDOR_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM vendor_profiles;" 2>/dev/null || echo "0")
        
        if [ "$VENDOR_COUNT" -gt "0" ]; then
            echo "✅ Sample vendor data found ($VENDOR_COUNT vendors)"
        else
            echo "⚠️  No sample vendor data found"
        fi
    fi
    
    echo ""
    echo "🚀 Setup verification completed!"
}

# Function to display usage instructions
show_usage() {
    echo ""
    echo "📚 Next Steps:"
    echo "=============="
    echo ""
    echo "1. Start your FANZ backend server:"
    echo "   cd backend && npm run dev"
    echo ""
    echo "2. Test the vendor access API:"
    echo "   curl http://localhost:3000/api/v1/vendor-access/health"
    echo ""
    echo "3. Access the vendor management endpoints:"
    echo "   POST /api/v1/vendor-access/vendors          (Register vendor)"
    echo "   GET  /api/v1/vendor-access/vendors          (List vendors)"
    echo "   POST /api/v1/vendor-access/grants           (Create access grant)"
    echo "   POST /api/v1/vendor-access/emergency/*      (Emergency controls)"
    echo ""
    echo "4. View system documentation:"
    echo "   See VENDOR_ACCESS_SYSTEM.md for complete API reference"
    echo ""
    echo "🛡️ Vendor Access System Ready!"
}

# Main execution flow
main() {
    # Check database connectivity
    if ! check_database; then
        echo ""
        echo "❌ Cannot proceed without database connection"
        echo "Please ensure PostgreSQL is running and credentials are correct"
        exit 1
    fi
    
    # Run migration
    run_migration
    
    # Create seed data
    read -p "📝 Would you like to create sample vendor data? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        seed_data
    else
        echo "⏭️  Skipping seed data creation"
    fi
    
    # Verify setup
    verify_setup
    
    # Show usage instructions
    show_usage
}

# Handle command line arguments
case "${1:-setup}" in
    "setup")
        main
        ;;
    "migrate")
        check_database && run_migration
        ;;
    "seed")
        check_database && seed_data
        ;;
    "verify")
        check_database && verify_setup
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  setup    - Full setup (migration + optional seed data)"
        echo "  migrate  - Run database migration only"
        echo "  seed     - Create seed data only"
        echo "  verify   - Verify setup"
        echo "  help     - Show this help message"
        ;;
    *)
        echo "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac