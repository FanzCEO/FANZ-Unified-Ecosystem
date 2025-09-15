#!/bin/bash

# 🚀 FANZ Unified Ecosystem - Database Setup Script
# Sets up PostgreSQL database and runs migrations for the unified ecosystem

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_NAME="${DB_NAME:-fanz_unified_ecosystem}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
MIGRATIONS_DIR="$(dirname "$0")/migrations"

echo -e "${BLUE}🚀 FANZ Unified Ecosystem - Database Setup${NC}"
echo -e "${BLUE}================================================${NC}"
echo

# Function to print status messages
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if PostgreSQL is running
check_postgres() {
    print_info "Checking PostgreSQL connection..."
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "SELECT version();" > /dev/null 2>&1; then
        print_status "PostgreSQL is running and accessible"
    else
        print_error "Cannot connect to PostgreSQL. Please ensure it's running and credentials are correct."
        exit 1
    fi
}

# Create database if it doesn't exist
create_database() {
    print_info "Checking if database '$DB_NAME' exists..."
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        print_warning "Database '$DB_NAME' already exists"
    else
        print_info "Creating database '$DB_NAME'..."
        createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
        print_status "Database '$DB_NAME' created successfully"
    fi
}

# Run a single migration file
run_migration() {
    local migration_file=$1
    local migration_name=$(basename "$migration_file" .up.sql)
    
    print_info "Running migration: $migration_name"
    
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration_file" > /dev/null 2>&1; then
        print_status "Migration '$migration_name' completed successfully"
    else
        print_error "Migration '$migration_name' failed"
        exit 1
    fi
}

# Run all migrations in order
run_migrations() {
    print_info "Running database migrations..."
    
    if [ ! -d "$MIGRATIONS_DIR" ]; then
        print_error "Migrations directory not found: $MIGRATIONS_DIR"
        exit 1
    fi
    
    # Find all .up.sql files and sort them
    migration_files=$(find "$MIGRATIONS_DIR" -name "*.up.sql" | sort)
    
    if [ -z "$migration_files" ]; then
        print_warning "No migration files found in $MIGRATIONS_DIR"
        return
    fi
    
    for migration_file in $migration_files; do
        run_migration "$migration_file"
    done
}

# Verify database schema
verify_schema() {
    print_info "Verifying database schema..."
    
    # Check if key tables exist
    local key_tables=("users" "creators" "content_posts" "transactions" "chart_of_accounts")
    
    for table in "${key_tables[@]}"; do
        if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1 FROM $table LIMIT 1;" > /dev/null 2>&1; then
            print_status "Table '$table' exists and accessible"
        else
            print_error "Table '$table' not found or inaccessible"
            exit 1
        fi
    done
}

# Show database statistics
show_stats() {
    print_info "Database statistics:"
    echo
    
    # Count tables
    table_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
    print_info "Total tables: $table_count"
    
    # Show platform clusters
    echo -e "${BLUE}Platform Clusters:${NC}"
    echo "  • FanzLab (Universal Portal)"
    echo "  • BoyFanz (Male Creators)"
    echo "  • GirlFanz (Female Creators)"
    echo "  • DaddyFanz (Dom/Sub Community)"
    echo "  • PupFanz (Pup Community)"
    echo "  • TabooFanz (Extreme Content)"
    echo "  • TransFanz (Trans Creators)"
    echo "  • CougarFanz (Mature Creators)"
    echo "  • FanzCock (Adult TikTok)"
    echo
    
    # Show specialized systems
    echo -e "${BLUE}Specialized Systems:${NC}"
    echo "  • CreatorCRM (Contact Management)"
    echo "  • BioLinkHub (Link Aggregation)"
    echo "  • ChatSphere (Messaging)"
    echo "  • MediaCore (Media Processing)"
    echo "  • FanzFinance OS (Financial Management)"
    echo "  • FusionGeniusFanzSocial (Social Networking)"
    echo "  • FanzShield (Security & Compliance)"
    echo
    
    print_status "Database setup completed successfully!"
    print_info "The FANZ Unified Ecosystem database is ready for 20+ million users across 9 platform clusters"
}

# Main execution
main() {
    echo -e "${BLUE}Starting database setup for FANZ Unified Ecosystem...${NC}"
    echo
    
    # Perform setup steps
    check_postgres
    create_database
    run_migrations
    verify_schema
    show_stats
    
    echo
    print_status "🎉 FANZ Unified Ecosystem database setup complete!"
    echo -e "${GREEN}Ready to support 9 platform clusters, 100+ microservices, and 20+ million users${NC}"
    echo
    print_info "Next steps:"
    echo "  1. Configure environment variables in your applications"
    echo "  2. Set up payment processor integrations (CCBill, Segpay, Paxum)"
    echo "  3. Configure media processing pipeline"
    echo "  4. Set up compliance monitoring"
    echo "  5. Initialize platform analytics"
}

# Handle command line arguments
case "${1:-setup}" in
    "setup")
        main
        ;;
    "migrate")
        check_postgres
        run_migrations
        print_status "Migrations completed successfully"
        ;;
    "verify")
        check_postgres
        verify_schema
        print_status "Schema verification passed"
        ;;
    "stats")
        check_postgres
        show_stats
        ;;
    "help"|"-h"|"--help")
        echo "FANZ Unified Ecosystem Database Setup"
        echo
        echo "Usage: $0 [command]"
        echo
        echo "Commands:"
        echo "  setup    - Full database setup (default)"
        echo "  migrate  - Run migrations only"
        echo "  verify   - Verify database schema"
        echo "  stats    - Show database statistics"
        echo "  help     - Show this help message"
        echo
        echo "Environment Variables:"
        echo "  DB_NAME  - Database name (default: fanz_unified_ecosystem)"
        echo "  DB_USER  - Database user (default: postgres)"
        echo "  DB_HOST  - Database host (default: localhost)"
        echo "  DB_PORT  - Database port (default: 5432)"
        ;;
    *)
        print_error "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac