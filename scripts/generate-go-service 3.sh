#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="${1:-}"
if [[ -z "$SERVICE_NAME" ]]; then
    echo "Usage: $0 <service-name>"
    echo "Example: $0 payment-service"
    exit 1
fi

SERVICE_DIR="services/$SERVICE_NAME"
mkdir -p "$SERVICE_DIR"/{app,helm}

echo "🛠️  Generating Go microservice: $SERVICE_NAME"

# Create main.go
cat > "$SERVICE_DIR/app/main.go" << 'EOF'
package main

import (
	"context"
	"encoding/json"
	"log"
	"math/rand"
	"net/http"
	"os"
	"os/signal"
	"runtime"
	"strconv"
	"syscall"
	"time"

	"github.com/gorilla/mux"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
	requestsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "http_requests_total",
			Help: "Total number of HTTP requests",
		},
		[]string{"path", "method", "status"},
	)
	
	requestDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name: "http_request_duration_seconds",
			Help: "HTTP request duration in seconds",
		},
		[]string{"path", "method"},
	)
)

type HealthResponse struct {
	Status    string            `json:"status"`
	Service   string            `json:"service"`
	Version   string            `json:"version"`
	Timestamp time.Time         `json:"timestamp"`
	Checks    map[string]string `json:"checks"`
}

type DiagnosticResponse struct {
	Uptime   string                 `json:"uptime"`
	Memory   map[string]interface{} `json:"memory"`
	Goroutines int                  `json:"goroutines"`
	Environment map[string]string   `json:"environment"`
}

var startTime = time.Now()

func metricsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		
		// Create a custom response writer to capture status code
		rw := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}
		
		next.ServeHTTP(rw, r)
		
		duration := time.Since(start).Seconds()
		statusCode := strconv.Itoa(rw.statusCode)
		
		requestsTotal.WithLabelValues(r.URL.Path, r.Method, statusCode).Inc()
		requestDuration.WithLabelValues(r.URL.Path, r.Method).Observe(duration)
	})
}

type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	response := HealthResponse{
		Status:    "healthy",
		Service:   "SERVICE_NAME_PLACEHOLDER",
		Version:   getEnv("SERVICE_VERSION", "v0.1.0"),
		Timestamp: time.Now(),
		Checks: map[string]string{
			"database": "ok",
			"cache":    "ok",
		},
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func readinessHandler(w http.ResponseWriter, r *http.Request) {
	// Add actual readiness checks here
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ready"})
}

func diagnosticsHandler(w http.ResponseWriter, r *http.Request) {
	uptime := time.Since(startTime)
	
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	
	response := DiagnosticResponse{
		Uptime: uptime.String(),
		Memory: map[string]interface{}{
			"alloc":      m.Alloc,
			"totalAlloc": m.TotalAlloc,
			"sys":        m.Sys,
			"numGC":      m.NumGC,
		},
		Goroutines: runtime.NumGoroutine(),
		Environment: map[string]string{
			"NODE_ENV": getEnv("NODE_ENV", "development"),
			"PORT":     getEnv("PORT", "3000"),
		},
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func simulateLoadHandler(w http.ResponseWriter, r *http.Request) {
	// Simulate some work
	time.Sleep(time.Duration(100+rand.Intn(400)) * time.Millisecond)
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Load simulation complete",
		"service": "SERVICE_NAME_PLACEHOLDER",
	})
}

func simulateErrorHandler(w http.ResponseWriter, r *http.Request) {
	if rand.Float32() < 0.3 { // 30% error rate
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Simulated error for testing",
		})
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Success",
	})
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func main() {
	port := getEnv("PORT", "3000")
	
	r := mux.NewRouter()
	
	// Apply middleware
	r.Use(metricsMiddleware)
	
	// Health endpoints
	r.HandleFunc("/healthz", healthHandler).Methods("GET")
	r.HandleFunc("/readiness", readinessHandler).Methods("GET")
	r.HandleFunc("/diagnostics", diagnosticsHandler).Methods("GET")
	
	// Metrics endpoint
	r.Handle("/metrics", promhttp.Handler()).Methods("GET")
	
	// Testing endpoints
	r.HandleFunc("/simulate-load", simulateLoadHandler).Methods("POST")
	r.HandleFunc("/simulate-error", simulateErrorHandler).Methods("POST")
	
	// Business logic endpoints (customize these)
	api := r.PathPrefix("/api/v1").Subrouter()
	api.HandleFunc("/status", func(w http.ResponseWriter, r *http.Request) {
		json.NewEncoder(w).Encode(map[string]string{
			"service": "SERVICE_NAME_PLACEHOLDER",
			"status":  "operational",
		})
	}).Methods("GET")
	
	srv := &http.Server{
		Addr:    ":" + port,
		Handler: r,
	}
	
	// Start server in goroutine
	go func() {
		log.Printf("🚀 SERVICE_NAME_PLACEHOLDER starting on port %s", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed to start: %v", err)
		}
	}()
	
	// Wait for interrupt signal
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	
	<-c
	log.Println("Shutting down server...")
	
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	
	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("Server forced to shutdown: %v", err)
	}
	
	log.Println("Server exited")
}
EOF

# Create go.mod
cat > "$SERVICE_DIR/app/go.mod" << EOF
module $SERVICE_NAME

go 1.21

require (
	github.com/gorilla/mux v1.8.0
	github.com/prometheus/client_golang v1.17.0
)
EOF

# Create Dockerfile
cat > "$SERVICE_DIR/app/Dockerfile" << 'EOF'
# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Install dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Production stage
FROM alpine:3.18

RUN apk --no-cache add ca-certificates tzdata
WORKDIR /root/

# Create non-root user
RUN adduser -D -s /bin/sh appuser

# Copy binary from builder stage
COPY --from=builder /app/main .

# Change ownership and switch to non-root user
RUN chown appuser:appuser main
USER appuser

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/healthz || exit 1

CMD ["./main"]
EOF

# Replace service name placeholders
sed -i.bak "s/SERVICE_NAME_PLACEHOLDER/$SERVICE_NAME/g" "$SERVICE_DIR/app/main.go"
rm "$SERVICE_DIR/app/main.go.bak"

# Create Helm chart structure
mkdir -p "$SERVICE_DIR/helm/$SERVICE_NAME/templates"

# Copy golden-api Helm chart and customize
if [[ -d "services/golden-api/helm/golden-api" ]]; then
    cp -r services/golden-api/helm/golden-api/* "$SERVICE_DIR/helm/$SERVICE_NAME/"
    
    # Update Chart.yaml
    sed -i.bak "s/golden-api/$SERVICE_NAME/g" "$SERVICE_DIR/helm/$SERVICE_NAME/Chart.yaml"
    rm "$SERVICE_DIR/helm/$SERVICE_NAME/Chart.yaml.bak"
    
    # Update values.yaml
    sed -i.bak "s/golden-api/$SERVICE_NAME/g" "$SERVICE_DIR/helm/$SERVICE_NAME/values.yaml"
    rm "$SERVICE_DIR/helm/$SERVICE_NAME/values.yaml.bak"
    
    # Update templates
    find "$SERVICE_DIR/helm/$SERVICE_NAME/templates" -name "*.yaml" -exec sed -i.bak "s/golden-api/$SERVICE_NAME/g" {} \;
    find "$SERVICE_DIR/helm/$SERVICE_NAME/templates" -name "*.bak" -delete
fi

# Make scripts executable
chmod +x scripts/*.sh

echo "✅ Go microservice '$SERVICE_NAME' generated successfully!"
echo ""
echo "📁 Generated files:"
echo "   $SERVICE_DIR/app/main.go"
echo "   $SERVICE_DIR/app/go.mod"
echo "   $SERVICE_DIR/app/Dockerfile"
echo "   $SERVICE_DIR/helm/$SERVICE_NAME/ (Helm chart)"
echo ""
echo "🚀 Next steps:"
echo "   1. cd $SERVICE_DIR/app"
echo "   2. go mod tidy"
echo "   3. go run main.go (test locally)"
echo "   4. ./scripts/deploy-service.sh $SERVICE_NAME"