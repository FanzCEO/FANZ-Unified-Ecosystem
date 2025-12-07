#!/bin/bash

# Deployment run script for Replit
# This starts only the API Gateway which serves as the main entry point

echo "Starting API Gateway for deployment..."

# Set environment variables
export PORT=8080
export REDIS_URL=redis://localhost:6379
export DATABASE_URL="${DATABASE_URL}"
export JWT_SECRET="${JWT_SECRET:-your-jwt-secret-key-change-in-production}"
export ENVIRONMENT="${ENVIRONMENT:-production}"

# Change to API Gateway directory and run
cd services/api-gateway
exec go run main.go