#!/bin/bash

# 🚀 FANZ API Gateway Deployment Script
# 
# Automated deployment and configuration for Kong API Gateway
# with all supporting services for the FANZ Ecosystem

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="fanz-api-gateway"
NETWORK_NAME="fanz-network"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to generate secure random string
generate_secret() {
    local length=${1:-32}
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    if ! command_exists openssl; then
        print_error "OpenSSL is not installed. Please install OpenSSL first."
        exit 1
    fi
    
    print_success "All prerequisites are installed."
}

# Function to create directory structure
create_directories() {
    print_status "Creating directory structure..."
    
    mkdir -p "${SCRIPT_DIR}/ssl"
    mkdir -p "${SCRIPT_DIR}/logs"
    mkdir -p "${SCRIPT_DIR}/plugins"
    mkdir -p "${SCRIPT_DIR}/scripts"
    mkdir -p "${SCRIPT_DIR}/grafana/dashboards"
    mkdir -p "${SCRIPT_DIR}/grafana/datasources"
    mkdir -p "${SCRIPT_DIR}/logstash/pipeline"
    mkdir -p "${SCRIPT_DIR}/logstash/config"
    mkdir -p "${SCRIPT_DIR}/prometheus"
    
    print_success "Directory structure created."
}

# Function to generate SSL certificates
generate_ssl_certificates() {
    print_status "Generating SSL certificates..."
    
    if [ ! -f "${SCRIPT_DIR}/ssl/fanz.crt" ]; then
        # Generate private key
        openssl genpkey -algorithm RSA -out "${SCRIPT_DIR}/ssl/fanz.key" -pkcs8 -aes-256-cbc -pass pass:fanz2024
        
        # Generate certificate signing request
        openssl req -new -key "${SCRIPT_DIR}/ssl/fanz.key" -out "${SCRIPT_DIR}/ssl/fanz.csr" -passin pass:fanz2024 -subj "/C=US/ST=California/L=Los Angeles/O=FANZ/OU=Engineering/CN=*.fanz.com"
        
        # Generate self-signed certificate
        openssl x509 -req -in "${SCRIPT_DIR}/ssl/fanz.csr" -signkey "${SCRIPT_DIR}/ssl/fanz.key" -out "${SCRIPT_DIR}/ssl/fanz.crt" -days 365 -passin pass:fanz2024
        
        # Remove passphrase from private key for Kong
        openssl rsa -in "${SCRIPT_DIR}/ssl/fanz.key" -out "${SCRIPT_DIR}/ssl/fanz.key" -passin pass:fanz2024
        
        print_success "SSL certificates generated."
    else
        print_warning "SSL certificates already exist. Skipping generation."
    fi
}

# Function to create environment file
create_env_file() {
    print_status "Creating environment configuration..."
    
    if [ ! -f "${SCRIPT_DIR}/.env" ]; then
        cp "${SCRIPT_DIR}/.env.example" "${SCRIPT_DIR}/.env"
        
        # Generate secure secrets
        KONG_DB_PASSWORD=$(generate_secret 24)
        REDIS_PASSWORD=$(generate_secret 24)
        KONG_ADMIN_SESSION_SECRET=$(generate_secret 32)
        OIDC_SESSION_SECRET=$(generate_secret 32)
        FANZ_ADMIN_API_KEY=$(generate_secret 40)
        FANZ_FINANCE_API_KEY=$(generate_secret 40)
        FANZ_MEDIA_API_KEY=$(generate_secret 40)
        JWT_SECRET_ADMIN=$(generate_secret 32)
        JWT_SECRET_FINANCE=$(generate_secret 32)
        GRAFANA_ADMIN_PASSWORD=$(generate_secret 16)
        GRAFANA_SECRET_KEY=$(generate_secret 32)
        KIBANA_ENCRYPTION_KEY=$(generate_secret 32)
        
        # Update .env file with generated secrets
        sed -i.bak "s/your_secure_kong_database_password_here/${KONG_DB_PASSWORD}/g" "${SCRIPT_DIR}/.env"
        sed -i.bak "s/your_secure_redis_password_here/${REDIS_PASSWORD}/g" "${SCRIPT_DIR}/.env"
        sed -i.bak "s/your_kong_admin_session_secret_key_here_32_chars/${KONG_ADMIN_SESSION_SECRET}/g" "${SCRIPT_DIR}/.env"
        sed -i.bak "s/your_oidc_session_secret_32_characters/${OIDC_SESSION_SECRET}/g" "${SCRIPT_DIR}/.env"
        sed -i.bak "s/fanz-admin-api-key-secure-string-here/${FANZ_ADMIN_API_KEY}/g" "${SCRIPT_DIR}/.env"
        sed -i.bak "s/fanz-finance-api-key-secure-string-here/${FANZ_FINANCE_API_KEY}/g" "${SCRIPT_DIR}/.env"
        sed -i.bak "s/fanz-media-api-key-secure-string-here/${FANZ_MEDIA_API_KEY}/g" "${SCRIPT_DIR}/.env"
        sed -i.bak "s/your_admin_jwt_secret_key_32_chars/${JWT_SECRET_ADMIN}/g" "${SCRIPT_DIR}/.env"
        sed -i.bak "s/your_finance_jwt_secret_key_32_chars/${JWT_SECRET_FINANCE}/g" "${SCRIPT_DIR}/.env"
        sed -i.bak "s/your_grafana_admin_password/${GRAFANA_ADMIN_PASSWORD}/g" "${SCRIPT_DIR}/.env"
        sed -i.bak "s/your_grafana_secret_key_32_characters/${GRAFANA_SECRET_KEY}/g" "${SCRIPT_DIR}/.env"
        sed -i.bak "s/your_kibana_encryption_key_32_chars/${KIBANA_ENCRYPTION_KEY}/g" "${SCRIPT_DIR}/.env"
        
        # Remove backup files
        rm -f "${SCRIPT_DIR}/.env.bak"
        
        print_success "Environment file created with secure secrets."
        print_warning "Please review and update ${SCRIPT_DIR}/.env with your actual configuration values."
    else
        print_warning "Environment file already exists. Skipping creation."
    fi
}

# Function to create additional configuration files
create_config_files() {
    print_status "Creating configuration files..."
    
    # Create Prometheus configuration
    cat > "${SCRIPT_DIR}/prometheus.yml" << 'EOF'
# Prometheus configuration for FANZ API Gateway monitoring
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'kong'
    static_configs:
      - targets: ['kong:9542']
    metrics_path: '/metrics'
    scrape_interval: 5s
    
  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
    metrics_path: '/metrics'
    
  - job_name: 'postgres'
    static_configs:
      - targets: ['kong-database:5432']
    metrics_path: '/metrics'
    
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']
EOF

    # Create Logstash configuration
    cat > "${SCRIPT_DIR}/logstash/config/logstash.yml" << 'EOF'
http.host: "0.0.0.0"
xpack.monitoring.elasticsearch.hosts: ["http://elasticsearch:9200"]
EOF

    # Create Logstash pipeline
    cat > "${SCRIPT_DIR}/logstash/pipeline/kong.conf" << 'EOF'
input {
  http {
    port => 5044
    codec => json
  }
}

filter {
  if [message] =~ /^fanz_log/ {
    grok {
      match => { "message" => "fanz_log %{IPORHOST:client_ip} - %{USER:remote_user} \\[%{HTTPDATE:timestamp}\\] \"%{WORD:method} %{URIPATHPARAM:request} HTTP/%{NUMBER:http_version}\" %{NUMBER:status_code} %{NUMBER:bytes_sent} \"%{DATA:referrer}\" \"%{DATA:user_agent}\" %{NUMBER:request_time} %{NUMBER:upstream_response_time} \"%{DATA:x_forwarded_for}\" \"%{DATA:x_cluster}\" \"%{DATA:x_request_id}\"" }
    }
    
    date {
      match => [ "timestamp", "dd/MMM/yyyy:HH:mm:ss Z" ]
    }
    
    mutate {
      convert => { "status_code" => "integer" }
      convert => { "bytes_sent" => "integer" }
      convert => { "request_time" => "float" }
      convert => { "upstream_response_time" => "float" }
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "fanz-api-gateway-%{+YYYY.MM.dd}"
  }
  
  stdout {
    codec => rubydebug
  }
}
EOF

    # Create Grafana datasource
    cat > "${SCRIPT_DIR}/grafana/datasources/prometheus.yml" << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
EOF

    # Create blocklist for WAF
    cat > "${SCRIPT_DIR}/blocklist.txt" << 'EOF'
# Blocked IP addresses (one per line)
# Example malicious IPs - replace with actual threat intelligence
192.0.2.1
203.0.113.1
EOF

    # Create Kong config loader script
    cat > "${SCRIPT_DIR}/scripts/load-config.sh" << 'EOF'
#!/bin/bash

set -e

echo "Loading Kong configuration..."

# Wait for Kong Admin API to be ready
until curl -f -s "${KONG_ADMIN_URL}/status" > /dev/null; do
    echo "Waiting for Kong Admin API..."
    sleep 2
done

echo "Kong Admin API is ready. Loading declarative configuration..."

# Load declarative configuration
curl -X POST "${KONG_ADMIN_URL}/config" \
     -F config=@/kong-config.yaml

echo "Kong configuration loaded successfully!"
EOF

    chmod +x "${SCRIPT_DIR}/scripts/load-config.sh"
    
    print_success "Configuration files created."
}

# Function to start services
start_services() {
    print_status "Starting FANZ API Gateway services..."
    
    cd "${SCRIPT_DIR}"
    
    # Pull latest images
    docker-compose pull
    
    # Start services
    docker-compose up -d
    
    print_status "Waiting for services to be healthy..."
    
    # Wait for Kong to be healthy
    local max_attempts=60
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if docker-compose ps kong | grep -q "(healthy)"; then
            break
        fi
        
        sleep 5
        attempt=$((attempt + 1))
        print_status "Waiting for Kong to be healthy... (${attempt}/${max_attempts})"
    done
    
    if [ $attempt -eq $max_attempts ]; then
        print_error "Kong failed to become healthy within expected time."
        docker-compose logs kong
        exit 1
    fi
    
    print_success "FANZ API Gateway is running!"
}

# Function to show service status
show_status() {
    print_status "Service Status:"
    cd "${SCRIPT_DIR}"
    docker-compose ps
    
    echo ""
    print_status "Access URLs:"
    echo "Kong Admin API: http://localhost:8001"
    echo "Kong Admin GUI: http://localhost:8002"
    echo "Kong Proxy HTTP: http://localhost:8000"
    echo "Kong Proxy HTTPS: https://localhost:8443"
    echo "Prometheus: http://localhost:9090"
    echo "Grafana: http://localhost:3001"
    echo "Elasticsearch: http://localhost:9200"
    echo "Kibana: http://localhost:5601"
    echo "Jaeger: http://localhost:16686"
    
    echo ""
    print_status "Important Configuration:"
    if [ -f "${SCRIPT_DIR}/.env" ]; then
        echo "Grafana Login: admin/$(grep GRAFANA_ADMIN_PASSWORD .env | cut -d'=' -f2)"
        echo "Admin API Key: $(grep FANZ_ADMIN_API_KEY .env | cut -d'=' -f2)"
        echo "Finance API Key: $(grep FANZ_FINANCE_API_KEY .env | cut -d'=' -f2)"
        echo "Media API Key: $(grep FANZ_MEDIA_API_KEY .env | cut -d'=' -f2)"
    fi
}

# Function to stop services
stop_services() {
    print_status "Stopping FANZ API Gateway services..."
    cd "${SCRIPT_DIR}"
    docker-compose down
    print_success "Services stopped."
}

# Function to cleanup everything
cleanup() {
    print_warning "This will remove all data and containers. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Cleaning up FANZ API Gateway..."
        cd "${SCRIPT_DIR}"
        docker-compose down -v --remove-orphans
        docker system prune -f
        print_success "Cleanup complete."
    else
        print_status "Cleanup cancelled."
    fi
}

# Function to show logs
show_logs() {
    cd "${SCRIPT_DIR}"
    if [ -n "$1" ]; then
        docker-compose logs -f "$1"
    else
        docker-compose logs -f
    fi
}

# Function to run health checks
health_check() {
    print_status "Running health checks..."
    
    cd "${SCRIPT_DIR}"
    
    # Check Kong
    if curl -f -s "http://localhost:8001/status" > /dev/null; then
        print_success "Kong Admin API is healthy"
    else
        print_error "Kong Admin API is not responding"
    fi
    
    # Check Prometheus
    if curl -f -s "http://localhost:9090/-/healthy" > /dev/null; then
        print_success "Prometheus is healthy"
    else
        print_error "Prometheus is not responding"
    fi
    
    # Check Elasticsearch
    if curl -f -s "http://localhost:9200/_cluster/health" > /dev/null; then
        print_success "Elasticsearch is healthy"
    else
        print_error "Elasticsearch is not responding"
    fi
}

# Function to backup configuration
backup_config() {
    print_status "Creating configuration backup..."
    
    local backup_dir="${SCRIPT_DIR}/backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    cp "${SCRIPT_DIR}/.env" "$backup_dir/" 2>/dev/null || true
    cp -r "${SCRIPT_DIR}/ssl" "$backup_dir/" 2>/dev/null || true
    cp "${SCRIPT_DIR}/kong-config.yaml" "$backup_dir/" 2>/dev/null || true
    
    # Export Kong configuration if running
    if curl -f -s "http://localhost:8001/status" > /dev/null 2>&1; then
        curl -s "http://localhost:8001/config" > "$backup_dir/kong-runtime-config.yaml"
    fi
    
    print_success "Configuration backed up to $backup_dir"
}

# Function to show help
show_help() {
    echo "FANZ API Gateway Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  deploy       Deploy the complete API Gateway stack"
    echo "  start        Start all services"
    echo "  stop         Stop all services"
    echo "  restart      Restart all services"
    echo "  status       Show service status and URLs"
    echo "  logs [svc]   Show logs (optionally for specific service)"
    echo "  health       Run health checks"
    echo "  backup       Backup configuration"
    echo "  cleanup      Remove all data and containers"
    echo "  help         Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy              # Full deployment"
    echo "  $0 logs kong           # Show Kong logs"
    echo "  $0 status              # Show all service status"
}

# Main execution
case "${1:-deploy}" in
    "deploy")
        check_prerequisites
        create_directories
        generate_ssl_certificates
        create_env_file
        create_config_files
        start_services
        show_status
        ;;
    "start")
        start_services
        show_status
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        stop_services
        sleep 2
        start_services
        show_status
        ;;
    "status")
        show_status
        ;;
    "logs")
        show_logs "$2"
        ;;
    "health")
        health_check
        ;;
    "backup")
        backup_config
        ;;
    "cleanup")
        cleanup
        ;;
    "help")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac