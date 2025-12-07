#!/bin/bash

# FANZ Legal Protection Services LLC - EIN Application Helper
# Run this script tomorrow after Articles of Organization are approved

set -e

echo "🏔️ FANZ Legal Protection Services LLC - EIN Application Helper"
echo "============================================================"
echo ""

# Check if Articles of Organization are ready
echo "📋 EIN Application Checklist:"
echo "- [ ] Articles of Organization approved by Wyoming SOS"
echo "- [ ] Have Wyoming LLC formation confirmation"
echo "- [ ] Business address confirmed"
echo "- [ ] SSN ready for responsible party"
echo ""

read -p "✅ Have you received confirmation that your Articles of Organization are approved? (y/n): " articles_approved

if [[ $articles_approved != "y" && $articles_approved != "Y" ]]; then
    echo "⏸️  Please wait for Articles of Organization approval before applying for EIN"
    echo "🔗 Check status at: https://sos.wyo.gov/Business/FilingSearch.aspx"
    exit 1
fi

echo ""
echo "🎯 EIN Application Information:"
echo "==============================="
echo ""

# Business Information
echo "📊 BUSINESS DETAILS TO ENTER:"
echo "Legal Name: FANZ Legal Protection Services LLC"
echo "Trade Name: FanzProtect"
echo "Business Type: Limited Liability Company (LLC)"
echo "Reason for EIN: Started new business"
echo "Business Start Date: $(date '+%m/%d/%Y')"
echo "Principal Business Activity: Legal Services"
echo "NAICS Code: 541110 (Offices of Lawyers)"
echo ""

# Tax Classification
echo "💰 TAX CLASSIFICATION:"
echo "Single Member LLC: Disregarded Entity (recommended)"
echo "Multi-Member LLC: Partnership"
echo ""

# Contact Information
echo "📞 CONTACT INFORMATION NEEDED:"
echo "- Business Phone Number"
echo "- Business Address (Wyoming registered address)"
echo "- Responsible Party Name and SSN"
echo "- Business Email Address"
echo ""

# Important Notes
echo "⚠️  IMPORTANT NOTES:"
echo "- Application is FREE directly with IRS"
echo "- Takes 5-10 minutes to complete"
echo "- EIN is issued immediately online"
echo "- Save/print the confirmation letter"
echo "- Avoid third-party services that charge fees"
echo ""

echo "🔗 OPENING IRS EIN APPLICATION..."
echo "Website: https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online"
echo ""

# Open IRS EIN application
open "https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online"

echo "✅ IRS EIN application website opened in browser"
echo ""
echo "📝 APPLICATION STEPS:"
echo "1. Click 'Apply Online Now'"
echo "2. Select 'Limited Liability Company (LLC)'"
echo "3. Enter business information from above"
echo "4. Choose tax classification (Disregarded Entity for single member)"
echo "5. Enter contact information"
echo "6. Review and submit (no payment required)"
echo "7. Save EIN confirmation letter to: ~/Downloads/"
echo ""

# Wait for user to complete application
echo "⏳ Complete the EIN application now..."
echo "📱 Call IRS at 1-800-829-4933 if you have questions"
echo ""

read -p "✅ Have you completed the EIN application and received your EIN? (y/n): " ein_completed

if [[ $ein_completed == "y" || $ein_completed == "Y" ]]; then
    echo ""
    read -p "🆔 Enter your new EIN (format: XX-XXXXXXX): " ein_number
    
    if [[ $ein_number =~ ^[0-9]{2}-[0-9]{7}$ ]]; then
        echo "✅ EIN format valid: $ein_number"
        
        # Save EIN to environment file
        echo "" >> .env.local
        echo "# Wyoming LLC Information - $(date)" >> .env.local
        echo "BUSINESS_LEGAL_NAME=\"FANZ Legal Protection Services LLC\"" >> .env.local  
        echo "BUSINESS_EIN=\"$ein_number\"" >> .env.local
        echo "BUSINESS_STATE=\"Wyoming\"" >> .env.local
        echo "BUSINESS_ENTITY_TYPE=\"LLC\"" >> .env.local
        echo "TAX_JURISDICTION=\"Wyoming\"" >> .env.local
        echo "FORMATION_DATE=\"$(date '+%Y-%m-%d')\"" >> .env.local
        
        echo "💾 EIN saved to .env.local file"
        echo ""
        echo "🎉 CONGRATULATIONS! Your Wyoming LLC is now ready for:"
        echo "- Business bank account opening"
        echo "- FanzProtect system integration"
        echo "- Tax-optimized operations"
        echo ""
        echo "📅 NEXT STEPS:"
        echo "1. Schedule business bank account appointment"
        echo "2. Update FanzProtect configuration with Wyoming details"
        echo "3. Deploy tax-optimized system"
        echo ""
        echo "🏦 BANKING NEXT:"
        echo "Run: ./scripts/prepare-banking.sh"
        
    else
        echo "❌ Invalid EIN format. Please check and try again."
        echo "📞 Contact IRS at 1-800-829-4933 if you need help"
    fi
else
    echo "⏸️  Complete the EIN application and run this script again"
    echo "💡 Bookmark this page to return: https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online"
fi

echo ""
echo "🏔️ Wyoming LLC Formation Progress:"
echo "✅ Business name verified"  
echo "✅ Articles of Organization filed"
echo "✅ EIN obtained"
echo "⏳ Business banking (next)"
echo "⏳ System integration (final)"
echo ""
echo "🛡️ FanzProtect Legal Protection Services is taking shape!"