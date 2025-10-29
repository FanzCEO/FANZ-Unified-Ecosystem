#!/usr/bin/env bash
set -uo pipefail

# FANZ Universe Platform Launcher - Complete Creator Economy
# ==========================================================

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_platform() { echo -e "${PURPLE}🚀 $1${NC}"; }

# Base directory for all FANZ platforms
FANZ_BASE_DIR="/Users/joshuastone/Documents/GitHub"

# Platform definitions with their ports and descriptions
declare -A FANZ_PLATFORMS=(
    # 🎛️  CONTROL CENTER
    ["FanzDash"]="3000:🎛️  FanzDash - Security Control Center & Dashboard"
    ["FanzSecurityCompDash"]="3001:🛡️  FanzSecurityDash - Security Compliance Dashboard"
    
    # 🔥 ADULT CONTENT PLATFORMS
    ["FanzCock"]="3002:🔥 FanzCock - Adult TikTok Platform"
    ["FanzTube"]="3003:📺 FanzTube - Video Streaming Platform"
    ["FanzEliteTubeV1"]="3004:💎 FanzElite - Premium Content Platform"
    ["FanzReels-1"]="3005:🎬 FanzReels - Short Video Platform"
    
    # 💰 COMMERCE & MONETIZATION
    ["FanzCommerceV1"]="3006:🛒 FanzCommerce - E-commerce Platform"
    ["FanzFiliate"]="3007:💰 FanzFiliate - Affiliate Marketing Platform"
    ["FanzWorkMarketplace"]="3008:🏢 FanzWork - Freelance Marketplace"
    ["StarzCardsV1"]="3009:🎴 StarzCards - NFT Trading Platform"
    ["FanzFinance-OS"]="3010:💳 FanzFinance - Financial Management OS"
    
    # 🤖 AI & INTELLIGENCE
    ["FanzSpicyAi"]="3011:🤖 FanzSpicyAI - Adult Content AI Assistant"
    ["FanzVarsity"]="3012:🎓 FanzVarsity - Creator Education Platform"
    
    # 👥 SOCIAL & COMMUNICATION  
    ["Fanz"]="3013:💙 Fanz - Main Social Platform"
    ["FanzMeetV1"]="3014:👥 FanzMeet - Social Networking Platform"
    ["FanzRadio"]="3015:📻 FanzRadio - Audio Content Platform"
    ["FanzWorld"]="3016:🌍 FanzWorld - Global Community Platform"
    ["ClubCentral"]="3017:🏛️  ClubCentral - Community Management Platform"
    
    # 🎥 MEDIA & PROCESSING
    ["FanzMediaCore"]="3018:🎥 FanzMediaCore - Media Processing Engine"
    ["FanzHubVaultV1"]="3019:🗄️  FanzHub - Content Vault & Storage"
    
    # 🛡️  SECURITY & PROTECTION
    ["FanzProtect"]="3020:🛡️  FanzProtect - Security & Protection Suite"
    
    # 🌐 MARKETING & LANDING
    ["FanzLanding"]="3021:🌐 FanzLanding - Landing Page Builder"
    ["FanzLink-Link-in-Bio"]="3022:🔗 FanzLink - Bio Link Management"
    
    # ⚙️  CORE SYSTEMS
    ["FanzOS"]="3023:⚙️  FanzOS - Core Operating System"
    ["FanzEcosystem"]="3024:🌟 FanzEcosystem - Unified Platform Hub"
    ["FanzOSMicroservices"]="3025:🔧 FanzOS Microservices - Core Services"
    ["Fanz.GO.OS.05"]="3026:🚀 FanzGO - High Performance OS Layer"
    ["Fanz.OS.GO.02"]="3027:⚡ FanzOS GO - Secondary OS Layer"
    
    # 📊 ANALYTICS & DASHBOARDS
    ["Starz-Social-Media-Dashboard"]="3028:📊 Starz Social Dashboard - Analytics Platform"
    ["Migration-HQ"]="3029:🔄 Migration HQ - Platform Migration Center"
    ["fanz-meta"]="3030:📈 FanzMeta - Platform Metadata & Analytics"
)

# Function to start a FANZ platform
start_platform() {
    local platform_name="$1"
    local port_desc="${FANZ_PLATFORMS[$platform_name]}"
    local port="${port_desc%%:*}"
    local description="${port_desc#*:}"
    
    local platform_dir="$FANZ_BASE_DIR/$platform_name"
    
    if [[ ! -d "$platform_dir" ]]; then
        log_warning "$platform_name not found at $platform_dir"
        return 1
    fi
    
    log_platform "Starting $description"
    
    cd "$platform_dir"
    
    # Look for package.json in common locations
    local package_json=""
    if [[ -f "package.json" ]]; then
        package_json="."
    elif [[ -f "client/package.json" ]]; then
        package_json="client"
    elif [[ -f "frontend/package.json" ]]; then
        package_json="frontend"
    elif [[ -f "web/package.json" ]]; then
        package_json="web"
    elif [[ -f "src/package.json" ]]; then
        package_json="src"
    fi
    
    if [[ -n "$package_json" ]]; then
        cd "$package_json"
        
        # Install dependencies if needed
        if [[ ! -d "node_modules" ]]; then
            log_info "Installing dependencies for $platform_name..."
            npm install >/dev/null 2>&1 || yarn install >/dev/null 2>&1 || {
                log_warning "Failed to install dependencies for $platform_name"
                cd - >/dev/null
                return 1
            }
        fi
        
        # Create/update .env with port
        if [[ -f ".env.example" && ! -f ".env" ]]; then
            cp .env.example .env
        fi
        
        # Set port in .env or create it
        if [[ -f ".env" ]]; then
            if grep -q "PORT=" .env; then
                sed -i.bak "s/PORT=.*/PORT=$port/" .env
            else
                echo "PORT=$port" >> .env
            fi
            rm .env.bak 2>/dev/null || true
        else
            echo "PORT=$port" > .env
        fi
        
        # Start the platform
        local start_cmd="npm start"
        if npm run | grep -q "dev"; then
            start_cmd="npm run dev"
        elif npm run | grep -q "serve"; then
            start_cmd="npm run serve"
        fi
        
        # Start in background
        if $start_cmd >/dev/null 2>&1 & then
            local pid=$!
            echo "$pid" > "/tmp/fanz_${platform_name}.pid"
            log_success "$platform_name started - http://localhost:$port"
            
            # Give it a moment to start up
            sleep 3
            
            # Check if it's actually running
            if ! kill -0 "$pid" 2>/dev/null; then
                log_warning "$platform_name may have failed to start properly"
                rm "/tmp/fanz_${platform_name}.pid" 2>/dev/null || true
            fi
        else
            log_warning "Failed to start $platform_name"
        fi
    else
        log_warning "No package.json found for $platform_name"
    fi
    
    cd - >/dev/null
}

# Function to stop all platforms
stop_all_platforms() {
    log_info "Stopping all FANZ platforms..."
    
    for pidfile in /tmp/fanz_*.pid; do
        if [[ -f "$pidfile" ]]; then
            local pid=$(cat "$pidfile")
            local platform=$(basename "$pidfile" .pid | sed 's/fanz_//')
            
            if kill -0 "$pid" 2>/dev/null; then
                kill "$pid"
                log_success "Stopped $platform"
            fi
            
            rm "$pidfile"
        fi
    done
    
    # Also kill any remaining node processes on FANZ ports
    for port in {3000..3025}; do
        local pid=$(lsof -ti:$port 2>/dev/null || true)
        if [[ -n "$pid" ]]; then
            kill "$pid" 2>/dev/null || true
        fi
    done
}

# Function to show running platforms
show_running_platforms() {
    echo -e "${CYAN}🌐 Running FANZ Platforms:${NC}"
    echo "=========================="
    
    local running=false
    
    for pidfile in /tmp/fanz_*.pid; do
        if [[ -f "$pidfile" ]]; then
            local pid=$(cat "$pidfile")
            local platform=$(basename "$pidfile" .pid | sed 's/fanz_//')
            
            if kill -0 "$pid" 2>/dev/null; then
                local port=$(lsof -p $pid -P -n 2>/dev/null | grep LISTEN | awk '{print $9}' | cut -d: -f2 | head -1)
                if [[ -n "$port" ]]; then
                    local desc="${FANZ_PLATFORMS[$platform]#*:}"
                    echo -e "${GREEN}✅ $desc - http://localhost:$port${NC}"
                    running=true
                fi
            fi
        fi
    done
    
    if [[ "$running" == "false" ]]; then
        echo "No platforms currently running."
        echo ""
        echo "Run: $0 core    # Start core platforms"
        echo "Run: $0 all     # Start all platforms"
    fi
}

# Main execution
case "${1:-help}" in
    "core")
        log_info "🚀 Launching Core FANZ Platforms..."
        start_platform "FanzDash"
        start_platform "FanzCock" 
        start_platform "FanzTube"
        start_platform "FanzSpicyAi"
        start_platform "FanzCommerceV1"
        
        echo ""
        log_success "🎉 Core FANZ Platforms Launched!"
        echo ""
        show_running_platforms
        ;;
    
    "commerce")
        log_info "💰 Launching Commerce Platforms..."
        start_platform "FanzCommerceV1"
        start_platform "FanzFiliate"
        start_platform "FanzWorkMarketplace"
        start_platform "StarzCards"
        show_running_platforms
        ;;
    
    "content")
        log_info "🎬 Launching Content Platforms..."
        start_platform "FanzTube"
        start_platform "FanzCock"
        start_platform "FanzEliteTubeV1"
        start_platform "FanzReels-1"
        start_platform "FanzRadio"
        show_running_platforms
        ;;
    
    "all")
        log_info "🌟 Launching ALL FANZ Platforms (this may take a while)..."
        for platform in "${!FANZ_PLATFORMS[@]}"; do
            start_platform "$platform"
            sleep 2
        done
        echo ""
        log_success "🎊 Complete FANZ Universe Launched!"
        echo ""
        show_running_platforms
        ;;
    
    "stop")
        stop_all_platforms
        ;;
    
    "status")
        show_running_platforms
        ;;
    
    "restart")
        stop_all_platforms
        sleep 3
        $0 core
        ;;
    
    *)
        echo -e "${PURPLE}🌟 FANZ Universe Platform Launcher${NC}"
        echo "===================================="
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo -e "${CYAN}Commands:${NC}"
        echo "  core      - Launch core creator platforms (FanzDash, FanzCock, FanzTube, etc.)"
        echo "  commerce  - Launch commerce platforms (FanzCommerce, FanzFiliate, etc.)"
        echo "  content   - Launch content platforms (FanzTube, FanzCock, FanzElite, etc.)"
        echo "  all       - Launch ALL FANZ platforms"
        echo "  stop      - Stop all running platforms"
        echo "  status    - Show running platforms and URLs"
        echo "  restart   - Restart core platforms"
        echo ""
        echo -e "${PURPLE}🚀 Available FANZ Platforms:${NC}"
        for platform in "${!FANZ_PLATFORMS[@]}"; do
            local desc="${FANZ_PLATFORMS[$platform]#*:}"
            echo "  $desc"
        done | sort
        echo ""
        echo -e "${GREEN}💡 Quick Start: Run '$0 core' to launch your main creator economy platforms!${NC}"
        ;;
esac