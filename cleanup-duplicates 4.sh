#!/bin/bash

# FANZ Documentation Cleanup Script
# Identifies potential duplicate documentation files

echo "🧹 FANZ Documentation Duplicate Analysis"
echo "=========================================="

PROJECT_ROOT="/Users/joshuastone/Documents/GitHub/FANZ_UNIFIED_ECOSYSTEM"

# Identify potential duplicate categories
echo "📋 Analysis of Root Documentation Files:"
echo

# Group similar files by category
echo "🔍 IMPLEMENTATION & COMPLETION STATUS:"
ls -la "$PROJECT_ROOT"/*COMPLETE*.md "$PROJECT_ROOT"/*IMPLEMENTATION*.md 2>/dev/null | awk '{print $9, "(" $5 " bytes)"}'
echo

echo "🔍 DEPLOYMENT & PRODUCTION:"
ls -la "$PROJECT_ROOT"/*DEPLOYMENT*.md "$PROJECT_ROOT"/*PRODUCTION*.md 2>/dev/null | awk '{print $9, "(" $5 " bytes)"}'
echo

echo "🔍 SECURITY RELATED:"
ls -la "$PROJECT_ROOT"/SECURITY*.md 2>/dev/null | awk '{print $9, "(" $5 " bytes)"}'
echo

echo "🔍 SYSTEM & PROJECT STATUS:"
ls -la "$PROJECT_ROOT"/*SYSTEM*.md "$PROJECT_ROOT"/*PROJECT*.md 2>/dev/null | awk '{print $9, "(" $5 " bytes)"}'
echo

echo "🔍 VENDOR ACCESS:"
ls -la "$PROJECT_ROOT"/*VENDOR*.md 2>/dev/null | awk '{print $9, "(" $5 " bytes)"}'
echo

echo "🔍 README FILES (multiple locations):"
find "$PROJECT_ROOT" -name "README.md" -not -path "*/node_modules/*" | head -10
echo

echo "📊 File Count Summary:"
echo "Total .md files (excluding node_modules): $(find "$PROJECT_ROOT" -name "*.md" -not -path "*/node_modules/*" | wc -l)"
echo "Root directory .md files: $(ls -1 "$PROJECT_ROOT"/*.md 2>/dev/null | wc -l)"

echo
echo "🎯 RECOMMENDATIONS:"
echo "=================="
echo
echo "1. MERGE SIMILAR FILES:"
echo "   - IMPLEMENTATION_COMPLETE.md + PROJECT_COMPLETE.md + SYSTEM_COMPLETE.md"
echo "   - VENDOR_ACCESS_IMPLEMENTATION_COMPLETE.md + VENDOR_ACCESS_SYSTEM.md"
echo "   - DEPLOYMENT_SUMMARY.md + PRODUCTION_READY.md"
echo
echo "2. CONSOLIDATE SECURITY DOCS:"
echo "   - SECURITY.md + SECURITY_FIXES.md -> Single comprehensive security doc"
echo
echo "3. ORGANIZE INTO DOCS FOLDER:"
echo "   - Move detailed implementation docs to docs/ folder"
echo "   - Keep only essential files in root (README.md, WARP.md)"
echo
echo "4. BACKEND DUPLICATE STATUS DOCS:"
backend_docs=$(find "$PROJECT_ROOT/backend" -name "*COMPLETE*.md" -o -name "*SUMMARY*.md" | wc -l)
echo "   - Backend has $backend_docs status documents that could be consolidated"

echo
echo "💡 CLEANUP SUGGESTIONS:"
echo "======================="
echo
echo "KEEP IN ROOT:"
echo "  ✅ README.md (main project overview)"
echo "  ✅ WARP.md (development guide)"
echo "  ✅ SECURITY.md (consolidated security info)"
echo
echo "MOVE TO docs/:"
echo "  📁 IMPLEMENTATION_COMPLETE.md -> docs/implementation-status.md"
echo "  📁 INTEGRATION_STATUS.md -> docs/integration-status.md"
echo "  📁 FANZ_ECOSYSTEM_INTEGRATION_PLAN.md -> docs/integration-plan.md"
echo
echo "CONSOLIDATE & ARCHIVE:"
echo "  🗂️ All *_COMPLETE.md files -> docs/implementation-history/"
echo "  🗂️ Multiple VENDOR_ACCESS files -> Single vendor access guide"
echo "  🗂️ DEPLOYMENT files -> docs/deployment/"

echo
echo "🚀 Next Steps:"
echo "=============="
echo "1. Review file contents to identify true duplicates"
echo "2. Merge complementary information"
echo "3. Archive outdated status documents"
echo "4. Update cross-references in remaining files"
echo "5. Create docs/README.md with documentation index"