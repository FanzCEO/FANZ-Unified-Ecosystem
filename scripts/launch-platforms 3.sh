#!/usr/bin/env bash
set -euo pipefail

# FANZ Platform Launcher - Start Your Creator Economy Services
# =============================================================

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }

echo "🚀 FANZ Platform Launcher"
echo "========================="

# Base port assignments
FANSGPT_PORT=3001
CREATOR_CRM_PORT=3002  
CHAT_SPHERE_PORT=3003
FANZ_SOCIAL_PORT=3004
MEDIA_CORE_PORT=3005

# Function to start a service
start_service() {
    local service_name="$1"
    local port="$2"
    local service_dir="services/$service_name"
    
    if [[ ! -d "$service_dir" ]]; then
        log_warning "Service $service_name not found in $service_dir"
        return 1
    fi
    
    log_info "Starting $service_name on port $port..."
    
    cd "$service_dir"
    
    # Install dependencies if node_modules doesn't exist
    if [[ -f "package.json" && ! -d "node_modules" ]]; then
        log_info "Installing dependencies for $service_name..."
        npm install >/dev/null 2>&1 || {
            log_warning "Failed to install dependencies for $service_name"
            cd - >/dev/null
            return 1
        }
    fi
    
    # Create .env if it doesn't exist
    if [[ -f ".env.example" && ! -f ".env" ]]; then
        log_info "Creating .env file for $service_name..."
        cp .env.example .env
        
        # Set the port in .env
        if grep -q "PORT=" .env; then
            sed -i.bak "s/PORT=.*/PORT=$port/" .env
            rm .env.bak 2>/dev/null || true
        else
            echo "PORT=$port" >> .env
        fi
        
        # Set basic default values
        sed -i.bak 's/your_openai_key_here/demo_mode/' .env 2>/dev/null || true
        sed -i.bak 's/your_anthropic_key_here/demo_mode/' .env 2>/dev/null || true
        rm .env.bak 2>/dev/null || true
    fi
    
    # Start the service in background
    if [[ -f "package.json" ]]; then
        if npm run dev >/dev/null 2>&1 & then
            local pid=$!
            echo "$pid" > "/tmp/fanz_${service_name}.pid"
            log_success "$service_name started (PID: $pid) - http://localhost:$port"
        else
            log_warning "Failed to start $service_name"
        fi
    fi
    
    cd - >/dev/null
}

# Function to stop all services
stop_services() {
    log_info "Stopping all FANZ services..."
    
    for pidfile in /tmp/fanz_*.pid; do
        if [[ -f "$pidfile" ]]; then
            local pid=$(cat "$pidfile")
            local service=$(basename "$pidfile" .pid | sed 's/fanz_//')
            
            if kill -0 "$pid" 2>/dev/null; then
                kill "$pid"
                log_success "Stopped $service (PID: $pid)"
            fi
            
            rm "$pidfile"
        fi
    done
}

# Function to show running services
show_services() {
    echo "🌐 Running FANZ Services:"
    echo "========================="
    
    local running=false
    
    for pidfile in /tmp/fanz_*.pid; do
        if [[ -f "$pidfile" ]]; then
            local pid=$(cat "$pidfile")
            local service=$(basename "$pidfile" .pid | sed 's/fanz_//')
            
            if kill -0 "$pid" 2>/dev/null; then
                echo "✅ $service - http://localhost:$(lsof -p $pid -P -n | grep LISTEN | awk '{print $9}' | cut -d: -f2 | head -1)"
                running=true
            fi
        fi
    done
    
    if [[ "$running" == "false" ]]; then
        echo "No services currently running."
        echo ""
        echo "Run: $0 start"
    fi
}

# Main execution
case "${1:-help}" in
    "start")
        log_info "Launching FANZ Creator Economy Platform..."
        
        # Start core services
        start_service "fanz-gpt" $FANSGPT_PORT
        sleep 2
        
        start_service "creator-crm" $CREATOR_CRM_PORT  
        sleep 2
        
        start_service "chat-sphere" $CHAT_SPHERE_PORT
        sleep 2
        
        start_service "fanz-social" $FANZ_SOCIAL_PORT
        sleep 2
        
        start_service "fanz-media-core" $MEDIA_CORE_PORT
        
        echo ""
        log_success "🎉 FANZ Platform Launched!"
        echo ""
        show_services
        echo ""
        echo "💡 Access your platforms above, or run '$0 status' to see them again"
        ;;
    
    "stop")
        stop_services
        ;;
    
    "status")
        show_services
        ;;
        
    "restart")
        stop_services
        sleep 3
        $0 start
        ;;
        
    *)
        echo "🎯 FANZ Platform Launcher"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  start    - Launch all FANZ creator economy services"
        echo "  stop     - Stop all running services"
        echo "  status   - Show running services and their URLs"
        echo "  restart  - Restart all services"
        echo ""
        echo "🌟 Available FANZ Services:"
        ls services/ | sed 's/^/  • /'
        echo ""
        echo "Run '$0 start' to launch your creator economy platform!"
        ;;
esac