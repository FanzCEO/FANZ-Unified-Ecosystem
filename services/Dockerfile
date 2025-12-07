# Multi-stage build for Go application
FROM golang:1.19-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy go mod files
COPY go.work go.work.sum ./
COPY shared/go.mod shared/go.sum ./shared/
COPY services/api-gateway/go.mod services/api-gateway/go.sum ./services/api-gateway/

# Download dependencies
RUN go mod download

# Copy source code
COPY shared ./shared
COPY services/api-gateway ./services/api-gateway

# Build the API Gateway
WORKDIR /app/services/api-gateway
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o api-gateway .

# Final stage
FROM alpine:latest

# Install runtime dependencies
RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy the binary from builder
COPY --from=builder /app/services/api-gateway/api-gateway .

# Expose port
EXPOSE 8080

# Set environment variables
ENV PORT=8080
ENV ENVIRONMENT=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Run the binary
CMD ["./api-gateway"]