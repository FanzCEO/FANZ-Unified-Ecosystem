#!/bin/bash
# NOTE: If you cannot execute this script, run:
#   chmod +x scripts/cleanup-git-lock.sh

# Script to safely remove .git/index.lock file
# This is useful when git operations are interrupted and leave stale lock files

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOCK_FILE="$REPO_ROOT/.git/index.lock"

echo "Git lock cleanup script"
echo "Repository root: $REPO_ROOT"
echo "Checking for lock file: $LOCK_FILE"

if [ -f "$LOCK_FILE" ]; then
    echo "Found .git/index.lock file, removing it..."
    rm -f "$LOCK_FILE"
    echo "Successfully removed .git/index.lock"
else
    echo "No .git/index.lock file found - nothing to clean up"
fi

echo "Git lock cleanup completed"