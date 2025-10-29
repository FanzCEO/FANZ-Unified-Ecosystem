# 🚀 FANZ Unified Ecosystem - Makefile for Go Services
# Centralized build automation for all Go microservices

.PHONY: help build test lint clean docker-build dev tools

# Default target
help: ## Show this help message
	@echo "FANZ Unified Ecosystem - Go Services Build System"
	@echo ""
	@echo "Available targets:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Go version and build info
GO_VERSION := $(shell go version | cut -d " " -f 3)
BUILD_TIME := $(shell date -u '+%Y-%m-%d_%H:%M:%S')
GIT_COMMIT := $(shell git rev-parse --short HEAD)
VERSION := 1.0.0

# Build flags
LDFLAGS := -ldflags "-X main.version=$(VERSION) -X main.buildTime=$(BUILD_TIME) -X main.gitCommit=$(GIT_COMMIT)"

# Go services directories
GO_SERVICES := $(shell find microservices -maxdepth 1 -type d -name "*service" | head -13)
FANZFINANCE_SERVICES := $(shell find fanzfinance-os -maxdepth 1 -type d -name "*service")

# Build all Go services
build: ## Build all Go microservices
	@echo "🔨 Building FANZ Go microservices..."
	@for service in $(GO_SERVICES) $(FANZFINANCE_SERVICES); do \
		if [ -f "$$service/go.mod" ]; then \
			echo "Building $$service..."; \
			cd $$service && go build $(LDFLAGS) -o bin/service ./cmd/main.go && cd ../..; \
		fi \
	done
	@echo "✅ All Go services built successfully"

# Test all Go services
test: ## Run tests for all Go services
	@echo "🧪 Testing FANZ Go microservices..."
	go test -race -cover ./...
	@echo "✅ All tests passed"

# Test with coverage
test-coverage: ## Run tests with coverage report
	@echo "📊 Running tests with coverage..."
	go test -race -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html
	@echo "✅ Coverage report generated: coverage.html"

# Lint all Go code
lint: ## Lint all Go code
	@echo "🔍 Linting FANZ Go code..."
	@which golangci-lint > /dev/null || (echo "Installing golangci-lint..." && go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest)
	golangci-lint run ./...
	@echo "✅ Linting completed"

# Format Go code
fmt: ## Format all Go code
	@echo "📝 Formatting Go code..."
	go fmt ./...
	@echo "✅ Code formatted"

# Clean build artifacts
clean: ## Clean build artifacts
	@echo "🧹 Cleaning build artifacts..."
	@for service in $(GO_SERVICES) $(FANZFINANCE_SERVICES); do \
		rm -rf $$service/bin; \
		rm -rf $$service/dist; \
	done
	rm -f coverage.out coverage.html
	@echo "✅ Clean completed"

# Install development tools
tools: ## Install development tools
	@echo "🛠️  Installing development tools..."
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	go install github.com/air-verse/air@latest
	go install github.com/swaggo/swag/cmd/swag@latest
	@echo "✅ Development tools installed"

# Development mode with hot reload
dev: ## Start development servers with hot reload
	@echo "🚀 Starting development mode..."
	@echo "Available services:"
	@for service in $(GO_SERVICES); do \
		echo "  make dev-$$service"; \
	done

# Docker build for all services
docker-build: ## Build Docker images for all services
	@echo "🐳 Building Docker images..."
	@for service in $(GO_SERVICES) $(FANZFINANCE_SERVICES); do \
		if [ -f "$$service/Dockerfile" ]; then \
			echo "Building Docker image for $$service..."; \
			docker build -t fanz/$$service:$(VERSION) $$service; \
		fi \
	done
	@echo "✅ All Docker images built"

# Security scan
security: ## Run security scan on Go code
	@echo "🔒 Running security scan..."
	@which gosec > /dev/null || go install github.com/securego/gosec/cmd/gosec@latest
	gosec ./...
	@echo "✅ Security scan completed"

# Benchmark tests
bench: ## Run benchmark tests
	@echo "⚡ Running benchmarks..."
	go test -bench=. -benchmem ./...
	@echo "✅ Benchmarks completed"

# Generate API documentation
docs: ## Generate API documentation
	@echo "📚 Generating API documentation..."
	@for service in $(GO_SERVICES); do \
		if [ -f "$$service/cmd/main.go" ]; then \
			cd $$service && swag init -g cmd/main.go && cd ../..; \
		fi \
	done
	@echo "✅ API documentation generated"

# Run all checks (test, lint, security)
check: test lint security ## Run all quality checks

# Production build
prod: clean tools check build ## Full production build with all checks

# Show environment info
info: ## Show build environment information
	@echo "🔍 Build Environment Information:"
	@echo "  Go Version: $(GO_VERSION)"
	@echo "  Build Time: $(BUILD_TIME)"
	@echo "  Git Commit: $(GIT_COMMIT)"
	@echo "  Version: $(VERSION)"
	@echo "  GOOS: $(shell go env GOOS)"
	@echo "  GOARCH: $(shell go env GOARCH)"