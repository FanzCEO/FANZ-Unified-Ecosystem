#!/bin/bash

# FansLab Multi-Server Startup Script
echo "🌟 Starting FansLab Platform Servers..."
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $EXPRESS_PID $GO_PID 2>/dev/null
    exit 0
}

# Set up trap for clean shutdown
trap cleanup EXIT INT TERM

# Start Express server in background
echo "🚀 Starting Express server on port 5000..."
npm run dev &
EXPRESS_PID=$!
echo "   Express server PID: $EXPRESS_PID"

# Wait a moment for Express to start
sleep 3

# Start Go server in background
echo "🚀 Starting Go server on port 8080..."
export GO_SERVER_PORT=8080
go run server.go &
GO_PID=$!
echo "   Go server PID: $GO_PID"

echo ""
echo "✅ Both servers are running!"
echo ""
echo "📍 Express Server (Main App):"
echo "   - URL: http://localhost:5000"
echo "   - API: http://localhost:5000/api/*"
echo ""
echo "📍 Go Server (Static & SSE):"
echo "   - URL: http://localhost:8080"
echo "   - Event Stream: http://localhost:8080/events"
echo "   - Status: http://localhost:8080/api/status"
echo "   - Trigger Event: http://localhost:8080/api/trigger-event"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for both processes
wait $EXPRESS_PID $GO_PID