#!/bin/bash

echo "🗂️  FANZ Repository Cleanup - Duplicate File Removal"
echo "=================================================="

# Count duplicates first
duplicate_count=$(find . -name "* 2*" -type f | wc -l)
echo "Found $duplicate_count duplicate files with ' 2' suffix"

# Show examples
echo ""
echo "Examples of files to be removed:"
find . -name "* 2*" -type f | head -10

echo ""
read -p "Do you want to proceed with removing these duplicates? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Removing duplicate files..."
    
    # Remove files with " 2" suffix
    find . -name "* 2*" -type f -delete
    
    # Remove empty directories that might be left behind
    find . -type d -empty -delete
    
    echo "✅ Cleanup completed!"
    echo "Removed $duplicate_count duplicate files"
else
    echo "❌ Cleanup cancelled"
fi
