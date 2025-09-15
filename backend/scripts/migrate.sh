#!/bin/bash

# FanzFinance OS - Database Migration Runner
# This script handles database migrations and seeding for the payment system

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DATABASE_DIR="$PROJECT_ROOT/database"
MIGRATIONS_DIR="$DATABASE_DIR/migrations"
SEEDS_DIR="$DATABASE_DIR/seeds"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Show usage information
show_usage() {
    cat << EOF
Usage: $0 [COMMAND] [OPTIONS]

Commands:
    init        Initialize database schema
    migrate     Run pending migrations
    seed        Seed database with sample data
    reset       Drop and recreate database (DESTRUCTIVE)
    status      Show migration status
    rollback    Rollback last migration (if supported)
    help        Show this help message

Options:
    --env ENV           Environment (local|dev|staging|prod) [default: local]
    --database DB       Database name [default: fanz_ecosystem]
    --host HOST         Database host [default: localhost]
    --port PORT         Database port [default: 5432]
    --user USER         Database user [default: postgres]
    --password PASS     Database password [default: postgres]
    --skip-seed         Skip seeding when running init
    --force             Force operations (use with caution)
    --dry-run           Show what would be executed without running

Environment Variables:
    DATABASE_URL        Full database URL (overrides individual options)
    DB_HOST             Database host
    DB_PORT             Database port
    DB_NAME             Database name
    DB_USER             Database username
    DB_PASSWORD         Database password

Examples:
    $0 init                              # Initialize with defaults
    $0 migrate --env staging             # Run migrations for staging
    $0 seed --database test_db           # Seed test database
    $0 reset --force                     # Reset database (destructive!)
    $0 status                            # Check migration status

EOF
}

# Parse command line arguments
parse_arguments() {
    COMMAND=""
    ENV="local"
    DB_HOST="${DB_HOST:-localhost}"
    DB_PORT="${DB_PORT:-5432}"
    DB_NAME="${DB_NAME:-fanz_ecosystem}"
    DB_USER="${DB_USER:-postgres}"
    DB_PASSWORD="${DB_PASSWORD:-postgres}"
    SKIP_SEED=false
    FORCE=false
    DRY_RUN=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            init|migrate|seed|reset|status|rollback|help)
                COMMAND="$1"
                shift
                ;;
            --env)
                ENV="$2"
                shift 2
                ;;
            --database)
                DB_NAME="$2"
                shift 2
                ;;
            --host)
                DB_HOST="$2"
                shift 2
                ;;
            --port)
                DB_PORT="$2"
                shift 2
                ;;
            --user)
                DB_USER="$2"
                shift 2
                ;;
            --password)
                DB_PASSWORD="$2"
                shift 2
                ;;
            --skip-seed)
                SKIP_SEED=true
                shift
                ;;
            --force)
                FORCE=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    if [[ -z "$COMMAND" ]]; then
        log_error "No command specified"
        show_usage
        exit 1
    fi
}

# Build database URL
build_db_url() {
    if [[ -n "${DATABASE_URL:-}" ]]; then
        echo "$DATABASE_URL"
    else
        echo "postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
    fi
}

# Check if PostgreSQL is available
check_postgres() {
    log_info "Checking PostgreSQL connection..."
    
    if ! command -v psql &> /dev/null; then
        log_error "psql command not found. Please install PostgreSQL client."
        exit 1
    fi
    
    if ! psql "$(build_db_url)" -c "SELECT 1;" &> /dev/null; then
        log_error "Cannot connect to PostgreSQL database"
        log_error "URL: $(build_db_url | sed 's/:.*@/:***@/')"
        exit 1
    fi
    
    log_success "PostgreSQL connection established"
}

# Execute SQL file
execute_sql_file() {
    local file="$1"
    local description="${2:-Running SQL file}"
    
    if [[ ! -f "$file" ]]; then
        log_error "SQL file not found: $file"
        exit 1
    fi
    
    log_info "$description: $(basename "$file")"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_warn "DRY RUN - Would execute: $file"
        return 0
    fi
    
    if psql "$(build_db_url)" -f "$file" -v ON_ERROR_STOP=1 --quiet; then
        log_success "Successfully executed: $(basename "$file")"
    else
        log_error "Failed to execute: $(basename "$file")"
        exit 1
    fi
}

# Get migration status
get_migration_status() {
    log_info "Checking migration status..."
    
    # Check if migration table exists
    if ! psql "$(build_db_url)" -c "SELECT 1 FROM schema_migrations LIMIT 1;" &> /dev/null; then
        echo "not_initialized"
        return
    fi
    
    # Get applied migrations
    local applied_migrations
    applied_migrations=$(psql "$(build_db_url)" -t -c "SELECT version FROM schema_migrations ORDER BY version;" | tr -d ' ')
    
    # Get available migrations
    local available_migrations=()
    if [[ -d "$MIGRATIONS_DIR" ]]; then
        while IFS= read -r -d '' file; do
            local version
            version=$(basename "$file" .sql)
            available_migrations+=("$version")
        done < <(find "$MIGRATIONS_DIR" -name "*.sql" -print0 | sort -z)
    fi
    
    # Compare applied vs available
    local pending_migrations=()
    for migration in "${available_migrations[@]}"; do
        if [[ ! "$applied_migrations" =~ $migration ]]; then
            pending_migrations+=("$migration")
        fi
    done
    
    echo "Applied migrations:"
    if [[ -n "$applied_migrations" ]]; then
        echo "$applied_migrations" | while read -r line; do
            [[ -n "$line" ]] && echo "  ✓ $line"
        done
    else
        echo "  (none)"
    fi
    
    echo ""
    echo "Pending migrations:"
    if [[ ${#pending_migrations[@]} -gt 0 ]]; then
        for migration in "${pending_migrations[@]}"; do
            echo "  ○ $migration"
        done
        echo ""
        echo "Total pending: ${#pending_migrations[@]}"
    else
        echo "  (none)"
        echo ""
        echo "Database is up to date!"
    fi
}

# Initialize database
cmd_init() {
    log_info "Initializing FanzFinance OS database..."
    log_info "Environment: $ENV"
    log_info "Database: $DB_NAME"
    
    check_postgres
    
    # Run initialization migration
    local init_migration="$MIGRATIONS_DIR/20250915_001_create_fanzfinance_schema.sql"
    if [[ -f "$init_migration" ]]; then
        execute_sql_file "$init_migration" "Running initialization migration"
    else
        log_error "Initialization migration not found: $init_migration"
        exit 1
    fi
    
    # Seed database unless skipped
    if [[ "$SKIP_SEED" == "false" ]]; then
        cmd_seed
    else
        log_info "Skipping database seeding (--skip-seed specified)"
    fi
    
    log_success "Database initialization completed!"
}

# Run migrations
cmd_migrate() {
    log_info "Running database migrations..."
    
    check_postgres
    
    # Get pending migrations
    local migrations=()
    if [[ -d "$MIGRATIONS_DIR" ]]; then
        while IFS= read -r -d '' file; do
            migrations+=("$file")
        done < <(find "$MIGRATIONS_DIR" -name "*.sql" -print0 | sort -z)
    fi
    
    if [[ ${#migrations[@]} -eq 0 ]]; then
        log_warn "No migration files found in $MIGRATIONS_DIR"
        return
    fi
    
    # Run each migration
    for migration in "${migrations[@]}"; do
        local version
        version=$(basename "$migration" .sql)
        
        # Check if already applied
        if psql "$(build_db_url)" -t -c "SELECT 1 FROM schema_migrations WHERE version = '$version';" 2>/dev/null | grep -q 1; then
            log_info "Migration already applied: $version"
            continue
        fi
        
        execute_sql_file "$migration" "Running migration"
    done
    
    log_success "All migrations completed!"
}

# Seed database
cmd_seed() {
    log_info "Seeding database with sample data..."
    
    check_postgres
    
    # Run seed files
    local seeds=()
    if [[ -d "$SEEDS_DIR" ]]; then
        while IFS= read -r -d '' file; do
            seeds+=("$file")
        done < <(find "$SEEDS_DIR" -name "*.sql" -print0 | sort -z)
    fi
    
    if [[ ${#seeds[@]} -eq 0 ]]; then
        log_warn "No seed files found in $SEEDS_DIR"
        return
    fi
    
    for seed in "${seeds[@]}"; do
        execute_sql_file "$seed" "Running seed"
    done
    
    log_success "Database seeding completed!"
}

# Reset database (destructive)
cmd_reset() {
    if [[ "$ENV" == "prod" || "$ENV" == "production" ]]; then
        log_error "Cannot reset production database!"
        exit 1
    fi
    
    if [[ "$FORCE" != "true" ]]; then
        log_warn "This will DROP ALL DATA in database '$DB_NAME'"
        read -p "Are you sure? Type 'yes' to continue: " confirmation
        if [[ "$confirmation" != "yes" ]]; then
            log_info "Reset cancelled"
            exit 0
        fi
    fi
    
    log_warn "Resetting database '$DB_NAME'..."
    
    check_postgres
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_warn "DRY RUN - Would reset database '$DB_NAME'"
        return 0
    fi
    
    # Drop and recreate database
    psql "postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/postgres" -c "DROP DATABASE IF EXISTS $DB_NAME;"
    psql "postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/postgres" -c "CREATE DATABASE $DB_NAME;"
    
    log_success "Database reset completed"
    
    # Reinitialize
    cmd_init
}

# Show migration status
cmd_status() {
    check_postgres
    get_migration_status
}

# Rollback migration (basic implementation)
cmd_rollback() {
    log_warn "Rollback functionality not implemented yet"
    log_info "For manual rollback, you can:"
    log_info "1. Connect to the database"
    log_info "2. Run rollback SQL manually"
    log_info "3. Remove the migration record from schema_migrations table"
    exit 1
}

# Help command
cmd_help() {
    show_usage
}

# Main execution
main() {
    parse_arguments "$@"
    
    log_info "FanzFinance OS Migration Tool"
    log_info "=============================="
    
    case "$COMMAND" in
        init)
            cmd_init
            ;;
        migrate)
            cmd_migrate
            ;;
        seed)
            cmd_seed
            ;;
        reset)
            cmd_reset
            ;;
        status)
            cmd_status
            ;;
        rollback)
            cmd_rollback
            ;;
        help)
            cmd_help
            ;;
        *)
            log_error "Unknown command: $COMMAND"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"