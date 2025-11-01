#!/bin/bash

# FanzFinance OS Payment Processing Demo
# Demonstrates the complete adult-friendly payment ecosystem

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# API Base URL
API_BASE="http://localhost:3000/api"
AUTH_TOKEN="Bearer demo-token-for-testing"

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

log_demo() {
    echo -e "${PURPLE}[DEMO]${NC} $1"
}

log_api() {
    echo -e "${CYAN}[API]${NC} $1"
}

# Check if server is running
check_server() {
    log_info "Checking if FanzFinance OS server is running..."
    
    if curl -s "$API_BASE/health" >/dev/null 2>&1; then
        log_success "Server is running"
    else
        log_error "Server is not running. Please start it with: npm run dev"
        exit 1
    fi
}

# Demo 1: Check available payment processors
demo_processor_status() {
    log_demo "=== Demo 1: Payment Processor Status ==="
    echo ""
    
    log_api "GET $API_BASE/payments/processors"
    
    response=$(curl -s -H "Authorization: $AUTH_TOKEN" "$API_BASE/payments/processors" || echo '{"error":"Request failed"}')
    
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    
    echo ""
    log_info "This shows all available adult-friendly payment processors and their health status"
    echo ""
}

# Demo 2: Process a subscription payment (Adult Content)
demo_subscription_payment() {
    log_demo "=== Demo 2: Adult Content Subscription Payment ==="
    echo ""
    
    log_info "Processing a monthly subscription payment for adult content..."
    
    payment_request='{
        "amount": 29.99,
        "currency": "USD",
        "transactionType": "subscription",
        "contentType": "adult",
        "customerInfo": {
            "email": "subscriber@example.com",
            "firstName": "John",
            "lastName": "Doe",
            "country": "US",
            "zipCode": "10001"
        },
        "paymentMethod": {
            "type": "credit_card",
            "details": {
                "token": "test_cc_token_123"
            }
        },
        "description": "FANZ Premium Monthly Subscription",
        "successUrl": "https://fanz.com/payment/success",
        "failureUrl": "https://fanz.com/payment/failure"
    }'
    
    log_api "POST $API_BASE/payments/process"
    echo "Request payload:"
    echo "$payment_request" | jq '.'
    echo ""
    
    response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: $AUTH_TOKEN" \
        -d "$payment_request" \
        "$API_BASE/payments/process" || echo '{"error":"Request failed"}')
    
    log_api "Response:"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    
    echo ""
    log_info "This demonstrates:"
    echo "  • Age verification and compliance checking"
    echo "  • Geographic routing (US customer → CCBill)"
    echo "  • Risk assessment for adult content"
    echo "  • Fallback processor support"
    echo ""
}

# Demo 3: European customer payment (Geographic Routing)
demo_european_payment() {
    log_demo "=== Demo 3: European Customer Geographic Routing ==="
    echo ""
    
    log_info "Processing payment from European customer (should route to Segpay)..."
    
    payment_request='{
        "amount": 19.99,
        "currency": "EUR",
        "transactionType": "one_time",
        "contentType": "adult",
        "customerInfo": {
            "email": "european@example.com",
            "firstName": "Hans",
            "lastName": "Mueller",
            "country": "DE",
            "zipCode": "10117"
        },
        "paymentMethod": {
            "type": "credit_card",
            "details": {
                "token": "test_eu_cc_token_456"
            }
        },
        "description": "FANZ Content Purchase"
    }'
    
    log_api "POST $API_BASE/payments/process"
    echo "Request payload:"
    echo "$payment_request" | jq '.'
    echo ""
    
    response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: $AUTH_TOKEN" \
        -d "$payment_request" \
        "$API_BASE/payments/process" || echo '{"error":"Request failed"}')
    
    log_api "Response:"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    
    echo ""
    log_info "This demonstrates intelligent geographic routing:"
    echo "  • European customer → Segpay (adult-friendly EU specialist)"
    echo "  • Currency conversion handling (EUR)"
    echo "  • Regional compliance considerations"
    echo ""
}

# Demo 4: Creator payout processing
demo_creator_payout() {
    log_demo "=== Demo 4: Creator Payout Processing ==="
    echo ""
    
    log_info "Processing payout to creator (industry-standard Paxum)..."
    
    payout_request='{
        "amount": 750.50,
        "currency": "USD",
        "destination": {
            "type": "paxum_ewallet",
            "details": {
                "email": "creator@example.com",
                "name": "Jane Creator"
            }
        },
        "description": "Monthly creator earnings payout"
    }'
    
    log_api "POST $API_BASE/payments/payouts"
    echo "Request payload:"
    echo "$payout_request" | jq '.'
    echo ""
    
    response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: $AUTH_TOKEN" \
        -d "$payout_request" \
        "$API_BASE/payments/payouts" || echo '{"error":"Request failed"}')
    
    log_api "Response:"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    
    echo ""
    log_info "This demonstrates creator payout compliance:"
    echo "  • Age verification (18+ required)"
    echo "  • 2257 compliance checking"
    echo "  • Tax form validation (W9/W8)"
    echo "  • Anti-money laundering (AML) checks"
    echo "  • Payout destination validation"
    echo ""
}

# Demo 5: High-risk transaction (Compliance Demo)
demo_high_risk_transaction() {
    log_demo "=== Demo 5: High-Risk Transaction Handling ==="
    echo ""
    
    log_info "Testing high-risk transaction that should require manual review..."
    
    payment_request='{
        "amount": 599.99,
        "currency": "USD",
        "transactionType": "one_time",
        "contentType": "adult",
        "customerInfo": {
            "email": "newuser@example.com",
            "firstName": "New",
            "lastName": "User",
            "country": "US"
        },
        "paymentMethod": {
            "type": "prepaid_card",
            "details": {
                "token": "test_prepaid_token_789"
            }
        },
        "description": "High-value content purchase",
        "metadata": {
            "userAgent": "SuspiciousBot/1.0",
            "ipAddress": "192.168.1.1"
        }
    }'
    
    log_api "POST $API_BASE/payments/process"
    echo "Request payload:"
    echo "$payment_request" | jq '.'
    echo ""
    
    response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: $AUTH_TOKEN" \
        -d "$payment_request" \
        "$API_BASE/payments/process" || echo '{"error":"Request failed"}')
    
    log_api "Response:"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    
    echo ""
    log_info "Risk factors that may trigger manual review:"
    echo "  • High transaction amount ($599.99)"
    echo "  • Prepaid payment method"
    echo "  • New account (if simulated)"
    echo "  • Suspicious device fingerprint"
    echo ""
}

# Demo 6: Refund processing
demo_refund_processing() {
    log_demo "=== Demo 6: Refund Processing ==="
    echo ""
    
    log_info "Processing a refund for a previous transaction..."
    
    refund_request='{
        "originalTransactionId": "txn_demo_123456",
        "amount": 29.99,
        "reason": "Customer requested refund",
        "processor": "ccbill"
    }'
    
    log_api "POST $API_BASE/payments/refunds"
    echo "Request payload:"
    echo "$refund_request" | jq '.'
    echo ""
    
    response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: $AUTH_TOKEN" \
        -d "$refund_request" \
        "$API_BASE/payments/refunds" || echo '{"error":"Request failed"}')
    
    log_api "Response:"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    
    echo ""
    log_info "Refund processing includes:"
    echo "  • Original transaction lookup"
    echo "  • Processor-specific refund API calls"
    echo "  • Compliance with adult industry refund policies"
    echo ""
}

# Demo 7: Transaction status check
demo_transaction_status() {
    log_demo "=== Demo 7: Transaction Status Tracking ==="
    echo ""
    
    log_info "Checking status of a transaction..."
    
    transaction_id="ccbill_demo_transaction_123"
    
    log_api "GET $API_BASE/payments/transactions/$transaction_id/status"
    
    response=$(curl -s -H "Authorization: $AUTH_TOKEN" \
        "$API_BASE/payments/transactions/$transaction_id/status" || echo '{"error":"Request failed"}')
    
    log_api "Response:"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    
    echo ""
    log_info "Transaction status tracking provides:"
    echo "  • Real-time status from payment processor"
    echo "  • Transaction lifecycle management"
    echo "  • Automated status updates via webhooks"
    echo ""
}

# Demo 8: Monitoring dashboard
demo_monitoring_dashboard() {
    log_demo "=== Demo 8: Payment Processing Monitoring ==="
    echo ""
    
    log_info "Fetching monitoring dashboard data..."
    
    log_api "GET $API_BASE/payments/monitoring/dashboard?hours=24"
    
    response=$(curl -s -H "Authorization: $AUTH_TOKEN" \
        "$API_BASE/payments/monitoring/dashboard?hours=24" || echo '{"error":"Request failed"}')
    
    log_api "Response:"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    
    echo ""
    log_info "Monitoring dashboard includes:"
    echo "  • Processor health and uptime metrics"
    echo "  • Transaction success/failure rates"
    echo "  • Response time monitoring"
    echo "  • Active alerts and notifications"
    echo "  • Performance analytics"
    echo ""
}

# Demo 9: Webhook simulation
demo_webhook_simulation() {
    log_demo "=== Demo 9: Webhook Processing ==="
    echo ""
    
    log_info "Simulating CCBill webhook for successful payment..."
    
    webhook_payload='{
        "eventType": "NewSaleSuccess",
        "subscriptionId": "12345",
        "transactionId": "demo_txn_webhook_001",
        "accountingAmount": "29.99",
        "accountingCurrency": "USD",
        "email": "customer@example.com",
        "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
    }'
    
    log_api "POST $API_BASE/payments/webhooks/ccbill"
    echo "Webhook payload:"
    echo "$webhook_payload" | jq '.'
    echo ""
    
    response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "X-Signature: demo-webhook-signature" \
        -H "X-Timestamp: $(date +%s)" \
        -d "$webhook_payload" \
        "$API_BASE/payments/webhooks/ccbill" || echo '{"error":"Request failed"}')
    
    log_api "Response:"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    
    echo ""
    log_info "Webhook processing includes:"
    echo "  • Signature verification for security"
    echo "  • Event type routing and handling"
    echo "  • Database updates and notifications"
    echo "  • Subscription lifecycle management"
    echo ""
}

# Demo summary and compliance overview
demo_compliance_summary() {
    log_demo "=== FanzFinance OS Compliance & Features Summary ==="
    echo ""
    
    echo -e "${GREEN}✅ Adult Industry Compliance:${NC}"
    echo "  • Age verification (18+) for all adult content"
    echo "  • 2257 record keeping compliance"
    echo "  • Creator identity verification"
    echo "  • Tax compliance (W9/W8 forms)"
    echo ""
    
    echo -e "${GREEN}✅ Payment Processing:${NC}"
    echo "  • CCBill - Primary US/Global adult processor"
    echo "  • Segpay - European adult content specialist"  
    echo "  • Paxum - Industry-standard creator payouts"
    echo "  • Intelligent geographic routing"
    echo "  • Multi-processor failover support"
    echo ""
    
    echo -e "${GREEN}✅ Risk Management:${NC}"
    echo "  • Real-time fraud detection"
    echo "  • Device fingerprinting"
    echo "  • Velocity checking"
    echo "  • Manual review triggers"
    echo "  • Chargeback prevention"
    echo ""
    
    echo -e "${GREEN}✅ Monitoring & Operations:${NC}"
    echo "  • Real-time health monitoring"
    echo "  • Performance metrics tracking"
    echo "  • Automated alerting"
    echo "  • Comprehensive logging"
    echo "  • Analytics and reporting"
    echo ""
    
    echo -e "${GREEN}✅ Security & Compliance:${NC}"
    echo "  • PCI DSS compliance (no card storage)"
    echo "  • GDPR compliance for EU customers"
    echo "  • AML and sanctions checking"
    echo "  • Secure webhook verification"
    echo "  • Encrypted data handling"
    echo ""
    
    log_success "FanzFinance OS provides a complete adult-friendly payment ecosystem!"
}

# Main execution
main() {
    clear
    echo -e "${PURPLE}"
    echo "███████╗ █████╗ ███╗   ██╗███████╗"
    echo "██╔════╝██╔══██╗████╗  ██║╚══███╔╝"
    echo "█████╗  ███████║██╔██╗ ██║  ███╔╝ "
    echo "██╔══╝  ██╔══██║██║╚██╗██║ ███╔╝  "
    echo "██║     ██║  ██║██║ ╚████║███████╗"
    echo "╚═╝     ╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝"
    echo -e "${NC}"
    echo "Payment Processing Demo - Adult-Friendly Ecosystem"
    echo "=================================================="
    echo ""
    
    check_server
    
    echo ""
    log_info "Starting comprehensive payment processing demo..."
    echo ""
    
    # Run all demos
    demo_processor_status
    read -p "Press Enter to continue to next demo..."
    
    demo_subscription_payment
    read -p "Press Enter to continue to next demo..."
    
    demo_european_payment
    read -p "Press Enter to continue to next demo..."
    
    demo_creator_payout
    read -p "Press Enter to continue to next demo..."
    
    demo_high_risk_transaction
    read -p "Press Enter to continue to next demo..."
    
    demo_refund_processing
    read -p "Press Enter to continue to next demo..."
    
    demo_transaction_status
    read -p "Press Enter to continue to next demo..."
    
    demo_monitoring_dashboard
    read -p "Press Enter to continue to next demo..."
    
    demo_webhook_simulation
    read -p "Press Enter to view compliance summary..."
    
    demo_compliance_summary
    
    echo ""
    log_success "Demo complete! 🎉"
    echo ""
    log_info "Next steps:"
    echo "  • Review the integration guide: docs/payment-processors-guide.md"
    echo "  • Run tests: npm test"
    echo "  • Check monitoring dashboard: http://localhost:3000/api/payments/monitoring/dashboard"
    echo "  • Explore API documentation for more endpoints"
    echo ""
}

# Check for dependencies
if ! command -v curl &> /dev/null; then
    log_error "curl is required for this demo"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    log_warn "jq not found - JSON responses will not be formatted"
fi

# Run the demo
main "$@"