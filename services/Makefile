# Makefile for FanzOS Microservices

.PHONY: help clean-git-lock build test clean

help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

clean-git-lock: ## Remove .git/index.lock file if it exists
	@echo "Removing .git/index.lock file..."
	@rm -f .git/index.lock
	@echo "✓ Git lock file cleanup completed"

build: ## Build all services
	@echo "Building all Go services..."
	@for service in services/*/; do \
		if [ -f "$$service/go.mod" ]; then \
			echo "Building $$service..."; \
			(cd "$$service" && go build -v .); \
		fi; \
	done
	@echo "✓ All services built"

test: ## Run all tests
	@echo "Running tests..."
	@for service in services/*/; do \
		if [ -f "$$service/go.mod" ]; then \
			echo "Testing $$service..."; \
			(cd "$$service" && go test -v ./...); \
		fi; \
	done
	@echo "✓ All tests completed"

clean: clean-git-lock ## Clean build artifacts and git locks
	@echo "Cleaning up..."
	@go clean -cache
	@echo "✓ Cleanup completed"