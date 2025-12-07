#!/bin/bash

# Fanz Operating System Deployment Script
# This script deploys the Fanz platform independently of any hosting provider

set -e

echo "🚀 Deploying Fanz Operating System..."

# Build the application
echo "📦 Building application..."
npm run build

# Check if running in production mode
if [ "$NODE_ENV" = "production" ]; then
    echo "🔧 Starting production server..."
    npm start
else
    echo "🔧 Starting development server..."
    npm run dev
fi

echo "✅ Fanz Operating System deployed successfully!"
echo "🌐 Platform accessible at: http://localhost:5000"