#!/bin/bash

# FanzProtect Tax Compliance Database Backup Script
# Automated daily backups with 7-year retention for tax compliance
# Wyoming-based legal services require comprehensive record keeping

set -euo pipefail

# Configuration
BACKUP_DIR="/backups"
DB_HOST="${DB_HOST:-fanzprotect-db}"
DB_NAME="${DB_NAME:-fanzprotect_tax}"
DB_USER="${DB_USER:-fanzprotect}"
DB_PASSWORD="${DB_PASSWORD}"
PGPASSWORD="${DB_PASSWORD}"
export PGPASSWORD

# Compliance settings (7 years = 2555 days)
RETENTION_DAYS=${RETENTION_DAYS:-2555}
COMPRESS_BACKUPS=${COMPRESS_BACKUPS:-true}
ENCRYPT_BACKUPS=${ENCRYPT_BACKUPS:-true}
BACKUP_ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY}"

# Alert configuration
WEBHOOK_URL="${BACKUP_WEBHOOK_URL}"
FANZDASH_API_KEY="${FANZDASH_API_KEY}"

# Logging
LOG_FILE="$BACKUP_DIR/backup.log"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="fanzprotect_tax_backup_$TIMESTAMP"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Check if database is accessible
check_database() {
    log "🔍 Checking database connectivity..."
    
    if pg_isready -h "$DB_HOST" -d "$DB_NAME" -U "$DB_USER" >/dev/null 2>&1; then
        log "✅ Database is accessible"
        return 0
    else
        error "❌ Database is not accessible"
        send_alert "Database connectivity check failed"
        exit 1
    fi
}

# Get database size and statistics
get_db_stats() {
    log "📊 Gathering database statistics..."
    
    # Get database size
    DB_SIZE=$(psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT pg_size_pretty(pg_database_size('$DB_NAME'));
    " | tr -d ' ')
    
    # Get table counts for key tax compliance tables
    TAX_CALCULATIONS=$(psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT COUNT(*) FROM tax_calculations;
    " | tr -d ' ')
    
    NEXUS_STATUS=$(psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT COUNT(*) FROM nexus_status;
    " | tr -d ' ')
    
    WYOMING_COMPLIANCE=$(psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT COUNT(*) FROM wyoming_compliance;
    " | tr -d ' ')
    
    log "📈 Database size: $DB_SIZE"
    log "📋 Tax calculations: $TAX_CALCULATIONS records"
    log "🗺️ Nexus status entries: $NEXUS_STATUS records"  
    log "🏔️ Wyoming compliance records: $WYOMING_COMPLIANCE records"
}

# Create comprehensive backup
create_backup() {
    log "💾 Starting comprehensive backup..."
    
    local backup_file="$BACKUP_DIR/$BACKUP_NAME.sql"
    local backup_start=$(date +%s)
    
    # Create schema-aware backup with specific tax compliance focus
    pg_dump \
        -h "$DB_HOST" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --verbose \
        --no-password \
        --format=custom \
        --compress=9 \
        --create \
        --clean \
        --if-exists \
        --quote-all-identifiers \
        --serializable-deferrable \
        --lock-wait-timeout=30000 \
        --dbname="$DB_NAME" \
        --file="$backup_file" \
        2>&1 | tee -a "$LOG_FILE"
    
    if [ $? -eq 0 ]; then
        local backup_end=$(date +%s)
        local backup_duration=$((backup_end - backup_start))
        local backup_size=$(du -h "$backup_file" | cut -f1)
        
        log "✅ Backup completed successfully in ${backup_duration}s"
        log "📦 Backup size: $backup_size"
        
        # Compress backup if enabled
        if [ "$COMPRESS_BACKUPS" = "true" ]; then
            compress_backup "$backup_file"
        fi
        
        # Encrypt backup if enabled
        if [ "$ENCRYPT_BACKUPS" = "true" ] && [ -n "$BACKUP_ENCRYPTION_KEY" ]; then
            encrypt_backup "$backup_file"
        fi
        
        return 0
    else
        error "❌ Backup failed"
        send_alert "Backup creation failed"
        exit 1
    fi
}

# Compress backup file
compress_backup() {
    local backup_file="$1"
    
    log "🗜️ Compressing backup..."
    
    gzip -9 "$backup_file"
    
    if [ $? -eq 0 ]; then
        local compressed_size=$(du -h "${backup_file}.gz" | cut -f1)
        log "✅ Backup compressed successfully: $compressed_size"
    else
        warn "⚠️ Backup compression failed"
    fi
}

# Encrypt backup file (using GPG or OpenSSL)
encrypt_backup() {
    local backup_file="$1"
    local encrypted_file="${backup_file}.enc"
    
    log "🔒 Encrypting backup..."
    
    # Use OpenSSL for encryption (AES-256-CBC)
    if openssl enc -aes-256-cbc -salt -in "$backup_file" -out "$encrypted_file" -pass pass:"$BACKUP_ENCRYPTION_KEY" 2>/dev/null; then
        # Remove unencrypted file
        rm "$backup_file"
        log "✅ Backup encrypted successfully"
    else
        warn "⚠️ Backup encryption failed"
    fi
}

# Create backup verification
verify_backup() {
    local backup_file="$1"
    
    log "🔍 Verifying backup integrity..."
    
    # Test backup file integrity
    if pg_restore --list "$backup_file" >/dev/null 2>&1; then
        log "✅ Backup verification successful"
        return 0
    else
        error "❌ Backup verification failed"
        send_alert "Backup verification failed"
        return 1
    fi
}

# Clean up old backups (7-year retention for tax compliance)
cleanup_old_backups() {
    log "🧹 Cleaning up backups older than $RETENTION_DAYS days..."
    
    local deleted_count=0
    local total_size_freed=0
    
    # Find and delete old backup files
    while IFS= read -r -d '' file; do
        local file_size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo 0)
        total_size_freed=$((total_size_freed + file_size))
        rm "$file"
        deleted_count=$((deleted_count + 1))
    done < <(find "$BACKUP_DIR" -name "fanzprotect_tax_backup_*" -type f -mtime +$RETENTION_DAYS -print0 2>/dev/null)
    
    if [ $deleted_count -gt 0 ]; then
        local size_freed=$(numfmt --to=iec $total_size_freed)
        log "✅ Cleaned up $deleted_count old backup(s), freed $size_freed"
    else
        log "ℹ️ No old backups to clean up"
    fi
}

# Send alert to FanzDash
send_alert() {
    local message="$1"
    local alert_level="${2:-error}"
    
    if [ -n "$WEBHOOK_URL" ] && [ -n "$FANZDASH_API_KEY" ]; then
        log "📢 Sending alert to FanzDash..."
        
        curl -s -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $FANZDASH_API_KEY" \
            -d "{
                \"source\": \"FanzProtect Tax Compliance Backup\",
                \"level\": \"$alert_level\",
                \"type\": \"BACKUP_ALERT\",
                \"message\": \"$message\",
                \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\",
                \"details\": {
                    \"backup_name\": \"$BACKUP_NAME\",
                    \"database\": \"$DB_NAME\",
                    \"wyoming_compliance\": \"7-year tax record retention\",
                    \"host\": \"$(hostname)\"
                }
            }" >/dev/null 2>&1
        
        if [ $? -eq 0 ]; then
            log "✅ Alert sent successfully"
        else
            warn "⚠️ Failed to send alert"
        fi
    fi
}

# Generate backup report
generate_report() {
    local backup_file="$1"
    local report_file="$BACKUP_DIR/backup_report_$TIMESTAMP.json"
    
    log "📋 Generating backup report..."
    
    # Get backup file stats
    local backup_size=$(du -b "$backup_file" 2>/dev/null | cut -f1 || echo 0)
    local backup_size_human=$(du -h "$backup_file" 2>/dev/null | cut -f1 || echo "0B")
    
    # Create detailed report
    cat > "$report_file" << EOF
{
    "backup_info": {
        "backup_name": "$BACKUP_NAME",
        "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)",
        "database": "$DB_NAME",
        "host": "$DB_HOST"
    },
    "wyoming_compliance": {
        "entity": "FANZ Legal Protection Services LLC",
        "retention_period": "$RETENTION_DAYS days",
        "compliance_purpose": "Wyoming-based legal services tax records",
        "legal_requirement": "7-year tax record retention"
    },
    "backup_stats": {
        "file_size_bytes": $backup_size,
        "file_size_human": "$backup_size_human",
        "database_size": "$DB_SIZE",
        "compressed": $COMPRESS_BACKUPS,
        "encrypted": $ENCRYPT_BACKUPS
    },
    "data_summary": {
        "tax_calculations": $TAX_CALCULATIONS,
        "nexus_status_records": $NEXUS_STATUS,
        "wyoming_compliance_records": $WYOMING_COMPLIANCE
    },
    "verification": {
        "integrity_check": "passed",
        "backup_format": "postgresql_custom",
        "compression_level": 9
    },
    "compliance_notes": [
        "Backup includes all tax compliance data",
        "Wyoming LLC legal services records maintained",
        "Economic nexus monitoring data preserved",
        "Adult content legal protection service records retained"
    ]
}
EOF
    
    log "✅ Backup report generated: $report_file"
}

# Main backup execution
main() {
    log "🛡️ FanzProtect Tax Compliance Backup Started"
    log "🏔️ Wyoming Legal Services - 7 Year Retention Policy"
    log "════════════════════════════════════════════════════════"
    
    # Pre-backup checks
    check_database
    get_db_stats
    
    # Create backup
    local backup_file="$BACKUP_DIR/$BACKUP_NAME.sql"
    create_backup
    
    # Verify backup
    if verify_backup "$backup_file"; then
        # Generate compliance report
        generate_report "$backup_file"
        
        # Cleanup old backups
        cleanup_old_backups
        
        # Send success notification
        send_alert "Tax compliance backup completed successfully" "info"
        
        log "════════════════════════════════════════════════════════"
        log "✅ FanzProtect Tax Compliance Backup Completed Successfully"
        log "📊 Database: $DB_SIZE | Records: $TAX_CALCULATIONS tax calculations"
        log "🏔️ Wyoming LLC compliance maintained with 7-year retention"
        
        exit 0
    else
        error "Backup verification failed"
        exit 1
    fi
}

# Handle script interruption
trap 'error "Backup interrupted"; exit 1' INT TERM

# Execute main function
main "$@"