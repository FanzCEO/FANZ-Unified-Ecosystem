#!/bin/bash

# 🚀 FANZ Unified Ecosystem - Production Deployment Script
# This script handles production deployment with health checks and rollback capability

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="fanz-backend"
APP_PORT=3000
HEALTH_ENDPOINT="http://localhost:${APP_PORT}/health"
MAX_HEALTH_CHECKS=30
HEALTH_CHECK_INTERVAL=2

# Deployment settings
BACKUP_DIR="/var/backups/fanz"
LOG_FILE="/var/log/fanz/deployment.log"
PM2_APP_NAME="fanz-api"

echo -e "${BLUE}🚀 Starting FANZ Backend Deployment${NC}"
echo "$(date): Starting deployment" >> "$LOG_FILE"

# Function to log messages
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
    echo "$(date): $1" >> "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    echo "$(date): ERROR: $1" >> "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
    echo "$(date): WARNING: $1" >> "$LOG_FILE"
}

# Function to check if service is healthy
check_health() {
    local count=0
    log "Checking application health..."
    
    while [ $count -lt $MAX_HEALTH_CHECKS ]; do
        if curl -f -s "$HEALTH_ENDPOINT" > /dev/null 2>&1; then
            log "✅ Health check passed"
            return 0
        fi
        
        count=$((count + 1))
        echo -n "."
        sleep $HEALTH_CHECK_INTERVAL
    done
    
    error "❌ Health check failed after $MAX_HEALTH_CHECKS attempts"
    return 1
}

# Function to create backup
create_backup() {
    if [ -d "dist" ]; then
        local backup_name="backup_$(date +%Y%m%d_%H%M%S)"
        log "Creating backup: $backup_name"
        
        mkdir -p "$BACKUP_DIR"
        cp -r dist "$BACKUP_DIR/$backup_name"
        
        # Keep only last 5 backups
        cd "$BACKUP_DIR"
        ls -t | tail -n +6 | xargs -r rm -rf
        cd - > /dev/null
        
        log "✅ Backup created successfully"
    fi
}

# Function to rollback
rollback() {
    error "🔄 Starting rollback procedure..."
    
    if [ -d "$BACKUP_DIR" ]; then
        local latest_backup=$(ls -t "$BACKUP_DIR" | head -n 1)
        if [ -n "$latest_backup" ]; then
            log "Rolling back to: $latest_backup"
            rm -rf dist
            cp -r "$BACKUP_DIR/$latest_backup" dist
            
            # Restart application
            if command -v pm2 &> /dev/null; then
                pm2 restart "$PM2_APP_NAME" || npm start &
            else
                pkill -f "node.*server.js" || true
                npm start &
            fi
            
            sleep 5
            if check_health; then
                log "✅ Rollback successful"
                return 0
            else
                error "❌ Rollback failed - manual intervention required"
                return 1
            fi
        fi
    fi
    
    error "❌ No backup found for rollback"
    return 1
}

# Function to install dependencies
install_dependencies() {
    log "📦 Installing dependencies..."
    
    if [ ! -f "package.json" ]; then
        error "package.json not found"
        exit 1
    fi
    
    # Clean install for production
    rm -rf node_modules package-lock.json
    npm ci --production
    
    log "✅ Dependencies installed"
}

# Function to run database migrations
run_migrations() {
    log "🗄️ Running database migrations..."
    
    if npm run db:migrate; then
        log "✅ Database migrations completed"
    else
        warning "⚠️ Database migrations failed or not configured"
    fi
}

# Function to build application
build_application() {
    log "🏗️ Building application..."
    
    if npm run build; then
        log "✅ Build completed successfully"
        
        # Verify build output
        if [ -f "dist/server.js" ]; then
            log "✅ Server entry point verified"
        else
            error "❌ Build failed - server.js not found"
            return 1
        fi
        
        # Count built files
        local file_count=$(find dist -name "*.js" | wc -l)
        log "📁 Built $file_count JavaScript files"
        
    else
        error "❌ Build failed"
        return 1
    fi
}

# Function to start application
start_application() {
    log "🚀 Starting application..."
    
    # Stop existing processes
    if command -v pm2 &> /dev/null; then
        pm2 stop "$PM2_APP_NAME" 2>/dev/null || true
        pm2 start dist/server.js --name "$PM2_APP_NAME" \
            --instances max \
            --exec-mode cluster \
            --max-memory-restart 1G \
            --log "/var/log/fanz/pm2.log" \
            --error "/var/log/fanz/pm2-error.log" \
            --out "/var/log/fanz/pm2-out.log"
    else
        # Fallback to npm start
        pkill -f "node.*server.js" || true
        nohup npm start > /var/log/fanz/app.log 2>&1 &
    fi
    
    # Wait for application to start
    sleep 5
    log "✅ Application started"
}

# Function to verify deployment
verify_deployment() {
    log "🔍 Verifying deployment..."
    
    # Check if process is running
    if pgrep -f "node.*server.js" > /dev/null; then
        log "✅ Application process is running"
    else
        error "❌ Application process not found"
        return 1
    fi
    
    # Health check
    if check_health; then
        log "✅ Application is responding to health checks"
        
        # Test specific endpoints
        if curl -f -s "${HEALTH_ENDPOINT%/health}/status" > /dev/null; then
            log "✅ Status endpoint responding"
        fi
        
        return 0
    else
        error "❌ Application health check failed"
        return 1
    fi
}

# Function to cleanup old builds
cleanup() {
    log "🧹 Cleaning up..."
    
    # Remove old log files (keep last 7 days)
    find /var/log/fanz -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true
    
    log "✅ Cleanup completed"
}

# Main deployment function
main() {
    local start_time=$(date +%s)
    
    log "🎯 Starting deployment process..."
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        error "package.json not found. Please run this script from the backend directory."
        exit 1
    fi
    
    # Check environment
    if [ "${NODE_ENV:-development}" != "production" ]; then
        warning "NODE_ENV is not set to production. Current: ${NODE_ENV:-development}"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "Deployment cancelled"
            exit 0
        fi
    fi
    
    # Pre-deployment checks
    log "🔍 Running pre-deployment checks..."
    
    # Check Node.js version
    if ! node --version | grep -E '^v1[89]\.' > /dev/null; then
        warning "Node.js version should be 18+ for production"
    fi
    
    # Check available disk space (need at least 1GB)
    available_space=$(df . | awk 'NR==2 {print $4}')
    if [ "$available_space" -lt 1048576 ]; then
        error "Insufficient disk space for deployment"
        exit 1
    fi
    
    # Create necessary directories
    mkdir -p /var/log/fanz "$BACKUP_DIR"
    
    # Main deployment steps
    create_backup || { error "Backup failed"; exit 1; }
    install_dependencies || { error "Dependency installation failed"; rollback; exit 1; }
    run_migrations || warning "Migrations may have failed"
    build_application || { error "Build failed"; rollback; exit 1; }
    start_application || { error "Application start failed"; rollback; exit 1; }
    
    # Verify deployment
    if verify_deployment; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        log "🎉 Deployment completed successfully in ${duration} seconds!"
        
        cleanup
        
        # Send notification (if configured)
        if [ -n "${SLACK_WEBHOOK:-}" ]; then
            curl -X POST -H 'Content-type: application/json' \
                --data "{\"text\":\"✅ FANZ Backend deployment successful\"}" \
                "$SLACK_WEBHOOK" 2>/dev/null || true
        fi
        
        log "🚀 FANZ Backend is now running in production!"
        log "📊 Health check: $HEALTH_ENDPOINT"
        log "📁 Logs: /var/log/fanz/"
        
    else
        error "Deployment verification failed"
        rollback
        exit 1
    fi
}

# Handle script arguments
case "${1:-}" in
    "rollback")
        rollback
        ;;
    "health")
        check_health
        ;;
    "logs")
        tail -f /var/log/fanz/app.log
        ;;
    "status")
        if pgrep -f "node.*server.js" > /dev/null; then
            echo "✅ Application is running"
            curl -s "$HEALTH_ENDPOINT" | jq '.' 2>/dev/null || curl -s "$HEALTH_ENDPOINT"
        else
            echo "❌ Application is not running"
            exit 1
        fi
        ;;
    *)
        main
        ;;
esac