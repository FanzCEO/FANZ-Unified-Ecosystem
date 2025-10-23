#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="${1:-}"
if [[ -z "$SERVICE_NAME" ]]; then
    echo "Usage: $0 <service-name>"
    echo "Example: $0 auth-service"
    exit 1
fi

SERVICE_DIR="services/$SERVICE_NAME"
mkdir -p "$SERVICE_DIR"/{app,helm}

echo "🐍 Generating Python FastAPI microservice: $SERVICE_NAME"

# Create main.py
cat > "$SERVICE_DIR/app/main.py" << 'EOF'
import asyncio
import json
import logging
import os
import random
import signal
import time
from contextlib import asynccontextmanager
from typing import Dict, Any

import psutil
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from pydantic import BaseModel
import uvicorn


# Metrics
request_count = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
request_duration = Histogram('http_request_duration_seconds', 'HTTP request duration', ['method', 'endpoint'])

# Global variables
start_time = time.time()
shutdown_event = asyncio.Event()

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    timestamp: float
    checks: Dict[str, str]

class DiagnosticResponse(BaseModel):
    uptime: float
    memory: Dict[str, Any]
    environment: Dict[str, str]
    process_info: Dict[str, Any]

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan events for startup and shutdown"""
    logging.info("🚀 SERVICE_NAME_PLACEHOLDER starting up...")
    yield
    logging.info("⏹️  SERVICE_NAME_PLACEHOLDER shutting down...")
    shutdown_event.set()

# Initialize FastAPI app
app = FastAPI(
    title="SERVICE_NAME_PLACEHOLDER",
    description="FANZ microservice built with FastAPI",
    version=os.getenv("SERVICE_VERSION", "v0.1.0"),
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Metrics middleware
@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start_time_req = time.time()
    
    response = await call_next(request)
    
    duration = time.time() - start_time_req
    
    request_count.labels(
        method=request.method,
        endpoint=request.url.path,
        status=str(response.status_code)
    ).inc()
    
    request_duration.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(duration)
    
    return response

@app.get("/healthz", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        service="SERVICE_NAME_PLACEHOLDER",
        version=os.getenv("SERVICE_VERSION", "v0.1.0"),
        timestamp=time.time(),
        checks={
            "database": "ok",
            "cache": "ok",
        }
    )

@app.get("/readiness")
async def readiness_check():
    """Readiness check endpoint"""
    # Add actual readiness checks here
    return {"status": "ready"}

@app.get("/diagnostics", response_model=DiagnosticResponse)
async def diagnostics():
    """Diagnostic information endpoint"""
    process = psutil.Process()
    memory_info = process.memory_info()
    
    return DiagnosticResponse(
        uptime=time.time() - start_time,
        memory={
            "rss": memory_info.rss,
            "vms": memory_info.vms,
            "percent": process.memory_percent(),
        },
        environment={
            "NODE_ENV": os.getenv("NODE_ENV", "development"),
            "PORT": os.getenv("PORT", "8000"),
            "PYTHON_VERSION": psutil.sys.version,
        },
        process_info={
            "pid": os.getpid(),
            "cpu_percent": process.cpu_percent(),
            "num_threads": process.num_threads(),
        }
    )

@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )

@app.post("/simulate-load")
async def simulate_load():
    """Simulate load for testing"""
    # Simulate some work
    await asyncio.sleep(random.uniform(0.1, 0.5))
    
    return {
        "message": "Load simulation complete",
        "service": "SERVICE_NAME_PLACEHOLDER"
    }

@app.post("/simulate-error")
async def simulate_error():
    """Simulate errors for testing"""
    if random.random() < 0.3:  # 30% error rate
        raise HTTPException(status_code=500, detail="Simulated error for testing")
    
    return {"message": "Success"}

# Business logic endpoints (customize these)
@app.get("/api/v1/status")
async def get_status():
    """Service status endpoint"""
    return {
        "service": "SERVICE_NAME_PLACEHOLDER",
        "status": "operational"
    }

# Signal handlers for graceful shutdown
def signal_handler(signum, frame):
    logging.info(f"Received signal {signum}")
    shutdown_event.set()

if __name__ == "__main__":
    # Set up logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    
    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    port = int(os.getenv("PORT", "8000"))
    
    # Run the server
    config = uvicorn.Config(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info",
        access_log=True
    )
    
    server = uvicorn.Server(config)
    
    try:
        asyncio.run(server.serve())
    except KeyboardInterrupt:
        logging.info("Received interrupt signal, shutting down...")
EOF

# Create requirements.txt
cat > "$SERVICE_DIR/app/requirements.txt" << 'EOF'
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
prometheus-client==0.19.0
psutil==5.9.6
python-multipart==0.0.6
EOF

# Create Dockerfile
cat > "$SERVICE_DIR/app/Dockerfile" << 'EOF'
# Build stage
FROM python:3.11-slim as builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Production stage
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for runtime
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd --create-home --shell /bin/bash appuser

# Copy installed packages from builder stage
COPY --from=builder /root/.local /home/appuser/.local

# Copy application code
COPY . .

# Change ownership and switch to non-root user
RUN chown -R appuser:appuser /app
USER appuser

# Add local pip packages to PATH
ENV PATH=/home/appuser/.local/bin:$PATH

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8000/healthz || exit 1

CMD ["python", "main.py"]
EOF

# Replace service name placeholders
sed -i.bak "s/SERVICE_NAME_PLACEHOLDER/$SERVICE_NAME/g" "$SERVICE_DIR/app/main.py"
rm "$SERVICE_DIR/app/main.py.bak"

# Create Helm chart structure
mkdir -p "$SERVICE_DIR/helm/$SERVICE_NAME/templates"

# Copy golden-api Helm chart and customize
if [[ -d "services/golden-api/helm/golden-api" ]]; then
    cp -r services/golden-api/helm/golden-api/* "$SERVICE_DIR/helm/$SERVICE_NAME/"
    
    # Update Chart.yaml
    sed -i.bak "s/golden-api/$SERVICE_NAME/g" "$SERVICE_DIR/helm/$SERVICE_NAME/Chart.yaml"
    rm "$SERVICE_DIR/helm/$SERVICE_NAME/Chart.yaml.bak"
    
    # Update values.yaml with Python-specific defaults
    sed -i.bak "s/golden-api/$SERVICE_NAME/g" "$SERVICE_DIR/helm/$SERVICE_NAME/values.yaml"
    sed -i.bak "s/containerPort: 3000/containerPort: 8000/g" "$SERVICE_DIR/helm/$SERVICE_NAME/values.yaml"
    sed -i.bak "s/port: 3000/port: 8000/g" "$SERVICE_DIR/helm/$SERVICE_NAME/values.yaml"
    rm "$SERVICE_DIR/helm/$SERVICE_NAME/values.yaml.bak"
    
    # Update templates
    find "$SERVICE_DIR/helm/$SERVICE_NAME/templates" -name "*.yaml" -exec sed -i.bak "s/golden-api/$SERVICE_NAME/g" {} \;
    find "$SERVICE_DIR/helm/$SERVICE_NAME/templates" -name "*.yaml" -exec sed -i.bak "s/containerPort: 3000/containerPort: 8000/g" {} \;
    find "$SERVICE_DIR/helm/$SERVICE_NAME/templates" -name "*.yaml" -exec sed -i.bak "s/port: 3000/port: 8000/g" {} \;
    find "$SERVICE_DIR/helm/$SERVICE_NAME/templates" -name "*.bak" -delete
fi

# Make scripts executable
chmod +x scripts/*.sh

echo "✅ Python FastAPI microservice '$SERVICE_NAME' generated successfully!"
echo ""
echo "📁 Generated files:"
echo "   $SERVICE_DIR/app/main.py"
echo "   $SERVICE_DIR/app/requirements.txt"
echo "   $SERVICE_DIR/app/Dockerfile"
echo "   $SERVICE_DIR/helm/$SERVICE_NAME/ (Helm chart)"
echo ""
echo "🚀 Next steps:"
echo "   1. cd $SERVICE_DIR/app"
echo "   2. pip install -r requirements.txt"
echo "   3. python main.py (test locally)"
echo "   4. ./scripts/deploy-service.sh $SERVICE_NAME"