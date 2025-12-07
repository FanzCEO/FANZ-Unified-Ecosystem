#!/bin/bash

# FANZ Legal Protection Services LLC - Business Banking Preparation
# Run this script after EIN is obtained

set -e

echo "🏦 FANZ Legal Protection Services LLC - Business Banking Setup"
echo "============================================================="
echo ""

# Check prerequisites
echo "📋 Banking Prerequisites Checklist:"
echo "- [ ] Wyoming LLC Articles of Organization (certified copy)"
echo "- [ ] Federal EIN confirmation letter"
echo "- [ ] Operating Agreement (from formation service)"
echo "- [ ] Government-issued photo ID"
echo "- [ ] Initial deposit ready (\$100-500)"
echo ""

read -p "✅ Do you have all the required documents? (y/n): " docs_ready

if [[ $docs_ready != "y" && $docs_ready != "Y" ]]; then
    echo "📄 REQUIRED DOCUMENTS:"
    echo ""
    echo "1. 📜 CERTIFIED COPY OF ARTICLES OF ORGANIZATION"
    echo "   - Order from Wyoming SOS: sos.wyo.gov"
    echo "   - Cost: \$10 per certified copy"
    echo "   - Takes 2-3 business days"
    echo ""
    echo "2. 🆔 EIN CONFIRMATION LETTER"
    echo "   - Print from IRS application confirmation"
    echo "   - Should be in ~/Downloads/"
    echo "   - Call IRS 1-800-829-4933 for duplicate"
    echo ""
    echo "3. 📋 OPERATING AGREEMENT"
    echo "   - Provided by formation service (LegalZoom, etc.)"
    echo "   - Must be signed by all members"
    echo "   - Original or certified copy required"
    echo ""
    echo "4. 🆔 GOVERNMENT-ISSUED ID"
    echo "   - Driver's license or passport"
    echo "   - Must be current and valid"
    echo ""
    echo "5. 💰 INITIAL DEPOSIT"
    echo "   - \$100-500 recommended"
    echo "   - Check, cash, or transfer from personal account"
    echo ""
    echo "🔄 Run this script again when you have all documents ready"
    exit 1
fi

echo ""
echo "🏦 RECOMMENDED BANKS FOR ADULT CONTENT BUSINESS:"
echo "==============================================="
echo ""

echo "1. 🟦 CHASE BUSINESS COMPLETE BANKING"
echo "   Monthly Fee: \$15 (waivable with \$2,000 balance)"
echo "   Benefits: No transaction limits, mobile deposit, online banking"
echo "   Adult Industry: Generally accepts adult businesses"
echo "   ATM Network: Large nationwide network"
echo "   Phone: 1-800-935-9935"
echo ""

echo "2. 🔴 BANK OF AMERICA BUSINESS ADVANTAGE"
echo "   Monthly Fee: \$16.95 (waivable with \$3,000 balance)"
echo "   Benefits: Preferred Rewards, mobile banking, merchant services"
echo "   Adult Industry: Case-by-case approval"
echo "   ATM Network: Extensive network"
echo "   Phone: 1-800-688-6086"
echo ""

echo "3. 🟨 WELLS FARGO SIMPLE BUSINESS CHECKING"
echo "   Monthly Fee: \$14 (waivable with \$500 balance)"
echo "   Benefits: No transaction fees, mobile deposit"
echo "   Adult Industry: May require additional documentation"
echo "   ATM Network: Large network"
echo "   Phone: 1-800-869-3557"
echo ""

echo "4. 💼 ALTERNATIVE OPTIONS:"
echo "   - Local Wyoming banks (often more flexible)"
echo "   - Business credit unions"
echo "   - Online banks (Azlo, Novo, Mercury)"
echo ""

read -p "🏦 Which bank would you like to schedule with? (chase/bofa/wells/other): " bank_choice

case $bank_choice in
    "chase"|"Chase"|"CHASE")
        echo ""
        echo "🟦 CHASE BUSINESS BANKING SETUP"
        echo "==============================="
        echo "Opening Chase business branch locator..."
        open "https://locator.chase.com/"
        BANK_NAME="Chase Business Banking"
        BANK_PHONE="1-800-935-9935"
        ;;
    "bofa"|"Bank of America"|"BOFA")
        echo ""
        echo "🔴 BANK OF AMERICA BUSINESS SETUP"
        echo "================================="
        echo "Opening Bank of America business locations..."
        open "https://locator.bankofamerica.com/"
        BANK_NAME="Bank of America Business"
        BANK_PHONE="1-800-688-6086"
        ;;
    "wells"|"Wells"|"WELLS")
        echo ""
        echo "🟨 WELLS FARGO BUSINESS SETUP"
        echo "============================="
        echo "Opening Wells Fargo branch locator..."
        open "https://www.wellsfargo.com/locator/"
        BANK_NAME="Wells Fargo Business"
        BANK_PHONE="1-800-869-3557"
        ;;
    *)
        echo ""
        echo "💼 OTHER BANKING OPTIONS"
        echo "========================"
        echo "Consider local Wyoming banks or online business banks"
        echo "They may be more flexible with adult industry businesses"
        BANK_NAME="Your chosen bank"
        BANK_PHONE="Contact bank directly"
        ;;
esac

echo ""
echo "📞 CALLING TO SCHEDULE APPOINTMENT"
echo "=================================="
echo ""
echo "📱 Call: $BANK_PHONE"
echo ""
echo "🗣️  SAY TO BANKER:"
echo "\"Hi, I need to schedule an appointment to open a business checking account"
echo "for my new Wyoming LLC. The business provides legal services for digital"
echo "content creators and requires merchant processing capabilities.\""
echo ""
echo "📋 INFORMATION TO PROVIDE:"
echo "- Business Name: FANZ Legal Protection Services LLC"
echo "- Business Type: Wyoming Limited Liability Company"
echo "- Industry: Professional Legal Services"
echo "- Services: DMCA takedowns, IP protection, legal consulting"
echo "- Expected Monthly Deposits: \$10,000-50,000+"
echo "- Need Merchant Services: Yes"
echo "- Account Type: Business Checking with merchant processing"
echo ""

read -p "⏸️  Press Enter after you've scheduled your appointment..."

echo ""
echo "📅 APPOINTMENT PREPARATION"
echo "========================="
echo ""
echo "✅ BRING TO APPOINTMENT:"
echo "□ Articles of Organization (certified copy)"
echo "□ EIN confirmation letter"
echo "□ Operating Agreement (signed)"
echo "□ Government-issued photo ID"
echo "□ Initial deposit (\$100-500)"
echo "□ Business address verification"
echo "□ Personal bank statements (if requested)"
echo ""

echo "💼 QUESTIONS TO ASK BANKER:"
echo "□ Monthly maintenance fees and how to waive them"
echo "□ Transaction limits and fees"
echo "□ Mobile deposit limits"
echo "□ Merchant processing rates and setup"
echo "□ Business credit card options"
echo "□ Wire transfer fees (important for adult industry)"
echo "□ ACH processing capabilities"
echo "□ Account monitoring and compliance requirements"
echo ""

echo "🚨 ADULT INDUSTRY DISCLOSURE:"
echo "Be upfront about your business model:"
echo "- Legal services for adult content creators"
echo "- DMCA takedown services"  
echo "- IP protection for digital content"
echo "- No direct adult content processing"
echo "- All services are legal professional services"
echo ""

echo "📞 BACKUP PLAN:"
echo "If first bank declines:"
echo "1. Try local Wyoming banks (more flexible)"
echo "2. Consider business credit unions"
echo "3. Online banks: Mercury, Novo, Azlo"
echo "4. Community banks in tech-friendly areas"
echo ""

# Save appointment info
echo ""
read -p "📅 What date/time is your appointment? (e.g., 'Friday 2PM'): " appointment_time
read -p "🏦 Which branch/location? (e.g., 'Downtown Denver'): " branch_location

echo ""
echo "💾 Saving appointment information..."

# Create appointment file
cat > banking-appointment.txt << EOF
FANZ LEGAL PROTECTION SERVICES LLC - BANKING APPOINTMENT
========================================================

Bank: $BANK_NAME
Phone: $BANK_PHONE
Appointment: $appointment_time
Location: $branch_location

DOCUMENTS TO BRING:
- Articles of Organization (certified copy)
- EIN confirmation letter  
- Operating Agreement (signed)
- Government-issued photo ID
- Initial deposit (\$100-500)

BUSINESS INFORMATION:
- Legal Name: FANZ Legal Protection Services LLC
- EIN: [From .env.local file]
- State: Wyoming
- Industry: Legal Services
- Business Type: Professional Services LLC

SERVICES DESCRIPTION:
Professional legal services including DMCA takedown services,
intellectual property protection, legal consultation for digital
content creators, and related legal advocacy services.

EXPECTED BANKING NEEDS:
- Monthly deposits: \$10,000-50,000+
- Merchant processing for legal service fees
- Wire transfers for client settlements
- ACH processing for subscription services
- Business credit card for operations

BACKUP OPTIONS:
- Local Wyoming banks
- Community banks
- Online business banks
- Credit unions

Created: $(date)
EOF

echo "✅ Appointment details saved to: banking-appointment.txt"
echo ""

echo "🎯 NEXT STEPS AFTER BANKING:"
echo "============================"
echo "1. ✅ Get business bank account opened"
echo "2. 🏦 Set up merchant processing"
echo "3. 💳 Apply for business credit card"
echo "4. 🔧 Update FanzProtect with Wyoming LLC details"
echo "5. 🚀 Deploy tax-optimized system"
echo ""

echo "🔄 SYSTEM INTEGRATION READY:"
echo "Once banking is complete, run:"
echo "  ./scripts/update-wyoming-config.sh"
echo ""

echo "🏔️ WYOMING LLC PROGRESS:"
echo "✅ Business name verified"
echo "✅ Articles of Organization filed"  
echo "✅ EIN obtained"
echo "⏳ Business banking (in progress)"
echo "⏳ System integration (next)"
echo ""

echo "🛡️ FanzProtect is almost ready to launch with Wyoming tax optimization!"
echo "📞 Call $BANK_PHONE if you need to reschedule your appointment"