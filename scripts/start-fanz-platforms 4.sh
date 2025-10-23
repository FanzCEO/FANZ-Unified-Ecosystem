#!/usr/bin/env bash

# FANZ Platform Launcher - Start Your Creator Economy
# ==================================================

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${PURPLE}🌟 FANZ Universe Platform Launcher${NC}"
echo "===================================="
echo ""

FANZ_DIR="/Users/joshuastone/Documents/GitHub"

show_platforms() {
    echo -e "${CYAN}🚀 Available FANZ Platforms:${NC}"
    echo ""
    echo "🎛️  CONTROL CENTER:"
    echo "  • FanzDash - Security Control Center & Dashboard"
    echo "  • FanzSecurityCompDash - Security Compliance Dashboard"
    echo ""
    echo "🔥 ADULT CONTENT PLATFORMS:"
    echo "  • FanzCock - Adult TikTok Platform" 
    echo "  • FanzTube - Video Streaming Platform"
    echo "  • FanzEliteTubeV1 - Premium Content Platform"
    echo "  • FanzReels-1 - Short Video Platform"
    echo ""
    echo "💰 COMMERCE & MONETIZATION:"
    echo "  • FanzCommerceV1 - E-commerce Platform"
    echo "  • FanzFiliate - Affiliate Marketing Platform"
    echo "  • FanzWorkMarketplace - Freelance Marketplace"
    echo "  • StarzCardsV1 - NFT Trading Platform"
    echo "  • FanzFinance-OS - Financial Management OS"
    echo ""
    echo "🤖 AI & INTELLIGENCE:"
    echo "  • FanzSpicyAi - Adult Content AI Assistant"
    echo "  • FanzVarsity - Creator Education Platform"
    echo ""
    echo "👥 SOCIAL & COMMUNICATION:"
    echo "  • Fanz - Main Social Platform"
    echo "  • FanzMeetV1 - Social Networking Platform"
    echo "  • FanzRadio - Audio Content Platform"
    echo "  • FanzWorld - Global Community Platform"
    echo "  • ClubCentral - Community Management Platform"
    echo ""
    echo "📊 ANALYTICS & TOOLS:"
    echo "  • Starz-Social-Media-Dashboard - Analytics Platform"
    echo "  • Migration-HQ - Platform Migration Center"
    echo "  • fanz-meta - Platform Metadata & Analytics"
}

start_platform() {
    local platform="$1"
    local port="$2"
    local platform_dir="$FANZ_DIR/$platform"
    
    if [[ ! -d "$platform_dir" ]]; then
        echo -e "${YELLOW}⚠️  $platform not found${NC}"
        return 1
    fi
    
    echo -e "${BLUE}ℹ️  Starting $platform on port $port...${NC}"
    
    cd "$platform_dir"
    
    # Look for package.json
    local npm_dir="."
    if [[ -f "client/package.json" ]]; then
        npm_dir="client"
    elif [[ -f "frontend/package.json" ]]; then
        npm_dir="frontend"
    elif [[ -f "web/package.json" ]]; then
        npm_dir="web"
    fi
    
    if [[ -f "$npm_dir/package.json" ]]; then
        cd "$npm_dir"
        
        # Install deps if needed
        if [[ ! -d "node_modules" ]]; then
            echo "Installing dependencies..."
            npm install >/dev/null 2>&1
        fi
        
        # Create .env with port
        echo "PORT=$port" > .env
        
        # Start platform
        npm start > "/tmp/${platform}.log" 2>&1 &
        local pid=$!
        echo "$pid" > "/tmp/${platform}.pid"
        
        echo -e "${GREEN}✅ $platform started - http://localhost:$port${NC}"
    else
        echo -e "${YELLOW}⚠️  No package.json found for $platform${NC}"
    fi
    
    cd - >/dev/null
}

stop_all() {
    echo -e "${BLUE}ℹ️  Stopping all FANZ platforms...${NC}"
    
    for pidfile in /tmp/Fanz*.pid /tmp/Starz*.pid /tmp/Club*.pid /tmp/Migration*.pid /tmp/fanz*.pid; do
        if [[ -f "$pidfile" ]]; then
            local pid=$(cat "$pidfile" 2>/dev/null)
            if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
                kill "$pid"
                local platform=$(basename "$pidfile" .pid)
                echo -e "${GREEN}✅ Stopped $platform${NC}"
            fi
            rm -f "$pidfile"
        fi
    done
    
    # Kill any remaining processes on our ports
    for port in {3000..3030}; do
        local pid=$(lsof -ti:$port 2>/dev/null)
        if [[ -n "$pid" ]]; then
            kill "$pid" 2>/dev/null
        fi
    done
}

case "${1:-help}" in
    "dash")
        start_platform "FanzDash" 3000
        ;;
    "cock")
        start_platform "FanzCock" 3001
        ;;
    "tube")
        start_platform "FanzTube" 3002
        ;;
    "commerce")
        start_platform "FanzCommerceV1" 3003
        ;;
    "spicy")
        start_platform "FanzSpicyAi" 3004
        ;;
    "core")
        echo -e "${PURPLE}🚀 Starting Core FANZ Platforms...${NC}"
        start_platform "FanzDash" 3000
        sleep 2
        start_platform "FanzCock" 3001
        sleep 2
        start_platform "FanzTube" 3002
        sleep 2
        start_platform "FanzSpicyAi" 3003
        sleep 2
        start_platform "FanzCommerceV1" 3004
        echo ""
        echo -e "${GREEN}🎉 Core platforms started!${NC}"
        ;;
    "stop")
        stop_all
        ;;
    "status")
        echo -e "${CYAN}🌐 Running FANZ Platforms:${NC}"
        echo "=========================="
        local found=false
        for port in {3000..3010}; do
            local pid=$(lsof -ti:$port 2>/dev/null)
            if [[ -n "$pid" ]]; then
                echo -e "${GREEN}✅ Port $port - http://localhost:$port${NC}"
                found=true
            fi
        done
        if [[ "$found" == "false" ]]; then
            echo "No platforms currently running."
        fi
        ;;
    *)
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  core     - Start core platforms (FanzDash, FanzCock, FanzTube, FanzSpicy, FanzCommerce)"
        echo "  dash     - Start FanzDash only"
        echo "  cock     - Start FanzCock only"
        echo "  tube     - Start FanzTube only"
        echo "  commerce - Start FanzCommerce only"
        echo "  spicy    - Start FanzSpicyAI only"
        echo "  stop     - Stop all platforms"
        echo "  status   - Show running platforms"
        echo ""
        show_platforms
        echo ""
        echo -e "${GREEN}💡 Quick Start: Run '$0 core' to launch your main platforms!${NC}"
        ;;
esac