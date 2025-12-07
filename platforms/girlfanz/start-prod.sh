#!/bin/bash
echo "🔨 Building Vite application..."
vite build

echo "✅ Vite build completed successfully!"
echo ""
echo "🔧 Compiling server TypeScript files..."
tsc --project tsconfig.server.json

if [ $? -eq 0 ]; then
  echo "✅ Server build completed successfully!"
  echo ""
  echo "🚀 Starting production server..."
  export PORT=5000
  export NODE_ENV=production
  node dist/server/index.js
else
  echo "❌ Server build failed with exit code: $?"
  exit 1
fi
