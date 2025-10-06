#!/bin/bash
set -euo pipefail

# FANZ AI Ecosystem Monitoring Setup Script
# Sets up comprehensive monitoring with Prometheus, Grafana, and alerting

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="${NAMESPACE:-fanz-ai-ecosystem}"
MONITORING_NAMESPACE="${MONITORING_NAMESPACE:-monitoring}"
GRAFANA_PASSWORD="${GRAFANA_PASSWORD:-fanz-grafana-admin}"
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"
EMAIL_RECIPIENT="${EMAIL_RECIPIENT:-}"

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
    exit 1
}

check_prerequisites() {
    log "Checking prerequisites..."
    
    command -v kubectl >/dev/null 2>&1 || error "kubectl is required but not installed"
    command -v helm >/dev/null 2>&1 || error "Helm is required but not installed"
    
    kubectl cluster-info >/dev/null 2>&1 || error "Cannot connect to Kubernetes cluster"
    
    success "Prerequisites checked"
}

setup_namespaces() {
    log "Setting up namespaces..."
    
    # Create monitoring namespace
    if ! kubectl get namespace "$MONITORING_NAMESPACE" >/dev/null 2>&1; then
        kubectl create namespace "$MONITORING_NAMESPACE"
        success "Created monitoring namespace"
    fi
    
    # Create application namespace if not exists
    if ! kubectl get namespace "$NAMESPACE" >/dev/null 2>&1; then
        kubectl create namespace "$NAMESPACE"
        success "Created application namespace"
    fi
}

install_prometheus_operator() {
    log "Installing Prometheus Operator..."
    
    # Add helm repositories
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts >/dev/null 2>&1 || true
    helm repo add grafana https://grafana.github.io/helm-charts >/dev/null 2>&1 || true
    helm repo update >/dev/null 2>&1
    
    # Install kube-prometheus-stack
    if ! helm list -n "$MONITORING_NAMESPACE" | grep -q prometheus-stack; then
        log "Deploying Prometheus stack..."
        
        cat > /tmp/prometheus-values.yaml << EOF
prometheus:
  prometheusSpec:
    retention: 30d
    storageSpec:
      volumeClaimTemplate:
        spec:
          storageClassName: standard
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 50Gi
    additionalScrapeConfigs:
      - job_name: 'fanz-ai-services'
        kubernetes_sd_configs:
          - role: pod
            namespaces:
              names:
                - ${NAMESPACE}
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            action: keep
            regex: true
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
            action: replace
            target_label: __metrics_path__
            regex: (.+)
          - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
            action: replace
            regex: ([^:]+)(?::\d+)?;(\d+)
            replacement: \$1:\$2
            target_label: __address__
          - action: labelmap
            regex: __meta_kubernetes_pod_label_(.+)
          - source_labels: [__meta_kubernetes_namespace]
            action: replace
            target_label: kubernetes_namespace
          - source_labels: [__meta_kubernetes_pod_name]
            action: replace
            target_label: kubernetes_pod_name

grafana:
  adminPassword: ${GRAFANA_PASSWORD}
  persistence:
    enabled: true
    size: 10Gi
  dashboardProviders:
    dashboardproviders.yaml:
      apiVersion: 1
      providers:
      - name: 'fanz-dashboards'
        orgId: 1
        folder: 'FANZ AI'
        type: file
        disableDeletion: false
        editable: true
        options:
          path: /var/lib/grafana/dashboards/fanz-dashboards
  dashboards:
    fanz-dashboards:
      fanz-overview:
        gnetId: 3662
        revision: 2
        datasource: Prometheus

alertmanager:
  config:
    global:
      smtp_smarthost: 'localhost:587'
      smtp_from: 'alerts@fanz.network'
    route:
      group_by: ['alertname']
      group_wait: 10s
      group_interval: 10s
      repeat_interval: 1h
      receiver: 'web.hook'
    receivers:
    - name: 'web.hook'
      webhook_configs:
      - url: '${SLACK_WEBHOOK}'
        send_resolved: true
    - name: 'email'
      email_configs:
      - to: '${EMAIL_RECIPIENT}'
        subject: 'FANZ AI Alert: {{ .GroupLabels.alertname }}'
        body: |
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          {{ end }}
EOF
        
        helm install prometheus-stack prometheus-community/kube-prometheus-stack \
            --namespace "$MONITORING_NAMESPACE" \
            --values /tmp/prometheus-values.yaml \
            --wait
        
        success "Prometheus stack deployed"
        rm -f /tmp/prometheus-values.yaml
    else
        success "Prometheus stack already installed"
    fi
}

create_custom_dashboards() {
    log "Creating custom Grafana dashboards..."
    
    # Create FANZ AI Overview Dashboard
    cat > /tmp/fanz-overview-dashboard.json << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "FANZ AI Ecosystem Overview",
    "tags": ["fanz", "ai", "ecosystem"],
    "style": "dark",
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Service Health Status",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=\"fanz-ai-services\"}",
            "legendFormat": "{{kubernetes_pod_name}}"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "mappings": [
              {
                "options": {
                  "0": {
                    "text": "DOWN",
                    "color": "red"
                  },
                  "1": {
                    "text": "UP",
                    "color": "green"
                  }
                },
                "type": "value"
              }
            ]
          }
        },
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 0,
          "y": 0
        }
      },
      {
        "id": 2,
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{job=\"fanz-ai-services\"}[5m])",
            "legendFormat": "{{kubernetes_pod_name}} - {{method}}"
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 12,
          "y": 0
        }
      },
      {
        "id": 3,
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job=\"fanz-ai-services\"}[5m]))",
            "legendFormat": "95th percentile - {{kubernetes_pod_name}}"
          },
          {
            "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket{job=\"fanz-ai-services\"}[5m]))",
            "legendFormat": "50th percentile - {{kubernetes_pod_name}}"
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 0,
          "y": 8
        }
      },
      {
        "id": 4,
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{job=\"fanz-ai-services\",status=~\"5..\"}[5m])",
            "legendFormat": "5xx errors - {{kubernetes_pod_name}}"
          },
          {
            "expr": "rate(http_requests_total{job=\"fanz-ai-services\",status=~\"4..\"}[5m])",
            "legendFormat": "4xx errors - {{kubernetes_pod_name}}"
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 12,
          "y": 8
        }
      },
      {
        "id": 5,
        "title": "CPU Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(container_cpu_usage_seconds_total{namespace=\"${NAMESPACE}\",container!=\"\"}[5m])",
            "legendFormat": "{{pod}} - {{container}}"
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 0,
          "y": 16
        }
      },
      {
        "id": 6,
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "container_memory_working_set_bytes{namespace=\"${NAMESPACE}\",container!=\"\"}",
            "legendFormat": "{{pod}} - {{container}}"
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 12,
          "y": 16
        }
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "30s"
  }
}
EOF

    # Import the dashboard using Grafana API
    GRAFANA_POD=$(kubectl get pods -n "$MONITORING_NAMESPACE" -l "app.kubernetes.io/name=grafana" -o jsonpath="{.items[0].metadata.name}")
    
    if [[ -n "$GRAFANA_POD" ]]; then
        kubectl port-forward -n "$MONITORING_NAMESPACE" pod/"$GRAFANA_POD" 3000:3000 &
        PF_PID=$!
        sleep 5
        
        curl -X POST \
            -H "Content-Type: application/json" \
            -d @/tmp/fanz-overview-dashboard.json \
            http://admin:"$GRAFANA_PASSWORD"@localhost:3000/api/dashboards/db >/dev/null 2>&1 || warning "Failed to import dashboard"
        
        kill $PF_PID 2>/dev/null || true
        success "Custom dashboard created"
        rm -f /tmp/fanz-overview-dashboard.json
    fi
}

setup_service_monitors() {
    log "Setting up service monitors..."
    
    # Create ServiceMonitor for FANZ AI services
    cat > /tmp/fanz-service-monitor.yaml << EOF
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: fanz-ai-services
  namespace: ${MONITORING_NAMESPACE}
  labels:
    app: fanz-ai-services
    component: monitoring
spec:
  selector:
    matchLabels:
      part-of: fanz-ecosystem
  namespaceSelector:
    matchNames:
    - ${NAMESPACE}
  endpoints:
  - port: http
    path: /metrics
    interval: 30s
    scrapeTimeout: 10s
EOF
    
    kubectl apply -f /tmp/fanz-service-monitor.yaml
    success "Service monitor created"
    rm -f /tmp/fanz-service-monitor.yaml
}

create_alerting_rules() {
    log "Creating alerting rules..."
    
    cat > /tmp/fanz-alerting-rules.yaml << EOF
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: fanz-ai-alerts
  namespace: ${MONITORING_NAMESPACE}
  labels:
    app: fanz-ai-services
    component: alerting
spec:
  groups:
  - name: fanz-ai-ecosystem
    rules:
    - alert: FANZServiceDown
      expr: up{job="fanz-ai-services"} == 0
      for: 2m
      labels:
        severity: critical
      annotations:
        summary: "FANZ AI service is down"
        description: "Service {{.labels.kubernetes_pod_name}} has been down for more than 2 minutes."
    
    - alert: FANZHighErrorRate
      expr: rate(http_requests_total{job="fanz-ai-services",status=~"5.."}[5m]) > 0.1
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "High error rate detected"
        description: "Service {{.labels.kubernetes_pod_name}} has error rate above 10% for 5 minutes."
    
    - alert: FANZHighResponseTime
      expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job="fanz-ai-services"}[5m])) > 1
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "High response time detected"
        description: "Service {{.labels.kubernetes_pod_name}} 95th percentile response time is above 1 second."
    
    - alert: FANZHighCPUUsage
      expr: rate(container_cpu_usage_seconds_total{namespace="${NAMESPACE}",container!=""}[5m]) > 0.8
      for: 10m
      labels:
        severity: warning
      annotations:
        summary: "High CPU usage detected"
        description: "Container {{.labels.container}} in pod {{.labels.pod}} has CPU usage above 80%."
    
    - alert: FANZHighMemoryUsage
      expr: container_memory_working_set_bytes{namespace="${NAMESPACE}",container!=""} / container_spec_memory_limit_bytes > 0.9
      for: 10m
      labels:
        severity: warning
      annotations:
        summary: "High memory usage detected"
        description: "Container {{.labels.container}} in pod {{.labels.pod}} has memory usage above 90%."
    
    - alert: FANZPodCrashLooping
      expr: rate(kube_pod_container_status_restarts_total{namespace="${NAMESPACE}"}[5m]) > 0
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "Pod is crash looping"
        description: "Pod {{.labels.pod}} in namespace {{.labels.namespace}} is crash looping."
EOF
    
    kubectl apply -f /tmp/fanz-alerting-rules.yaml
    success "Alerting rules created"
    rm -f /tmp/fanz-alerting-rules.yaml
}

setup_log_aggregation() {
    log "Setting up log aggregation with Loki..."
    
    # Install Loki stack
    if ! helm list -n "$MONITORING_NAMESPACE" | grep -q loki; then
        cat > /tmp/loki-values.yaml << EOF
loki:
  persistence:
    enabled: true
    size: 20Gi
  config:
    limits_config:
      retention_period: 168h
    table_manager:
      retention_deletes_enabled: true
      retention_period: 168h

promtail:
  config:
    clients:
      - url: http://loki:3100/loki/api/v1/push
    scrape_configs:
      - job_name: kubernetes-pods
        kubernetes_sd_configs:
          - role: pod
        relabel_configs:
          - source_labels:
              - __meta_kubernetes_pod_controller_name
            regex: ([0-9a-z-.]+?)(-[0-9a-f]{8,10})?
            action: replace
            target_label: __tmp_controller_name
          - source_labels:
              - __meta_kubernetes_pod_label_app_kubernetes_io_name
              - __meta_kubernetes_pod_label_app
              - __tmp_controller_name
              - __meta_kubernetes_pod_name
            regex: ^;*([^;]+)(;.*)?$
            action: replace
            target_label: app
          - source_labels:
              - __meta_kubernetes_pod_label_app_kubernetes_io_component
              - __meta_kubernetes_pod_label_component
            regex: ^;*([^;]+)(;.*)?$
            action: replace
            target_label: component
          - action: replace
            source_labels:
            - __meta_kubernetes_pod_node_name
            target_label: node_name
          - action: replace
            source_labels:
            - __meta_kubernetes_namespace
            target_label: namespace
          - action: replace
            replacement: /var/log/pods/*\$1/*.log
            separator: /
            source_labels:
            - __meta_kubernetes_pod_uid
            - __meta_kubernetes_pod_container_name
            target_label: __path__

grafana:
  enabled: true
  adminPassword: ${GRAFANA_PASSWORD}
EOF
        
        helm install loki grafana/loki-stack \
            --namespace "$MONITORING_NAMESPACE" \
            --values /tmp/loki-values.yaml \
            --wait
        
        success "Loki stack deployed"
        rm -f /tmp/loki-values.yaml
    else
        success "Loki stack already installed"
    fi
}

create_monitoring_dashboard_configmap() {
    log "Creating monitoring dashboard ConfigMap..."
    
    kubectl create configmap monitoring-dashboard \
        --from-literal=grafana-url="http://prometheus-stack-grafana.${MONITORING_NAMESPACE}.svc.cluster.local" \
        --from-literal=prometheus-url="http://prometheus-stack-kube-prom-prometheus.${MONITORING_NAMESPACE}.svc.cluster.local:9090" \
        --from-literal=alertmanager-url="http://prometheus-stack-kube-prom-alertmanager.${MONITORING_NAMESPACE}.svc.cluster.local:9093" \
        -n "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
    
    success "Monitoring dashboard ConfigMap created"
}

display_access_info() {
    log "Monitoring stack access information:"
    echo ""
    echo "📊 Grafana Dashboard:"
    echo "  kubectl port-forward -n $MONITORING_NAMESPACE svc/prometheus-stack-grafana 3000:80"
    echo "  URL: http://localhost:3000"
    echo "  Username: admin"
    echo "  Password: $GRAFANA_PASSWORD"
    echo ""
    echo "🔍 Prometheus:"
    echo "  kubectl port-forward -n $MONITORING_NAMESPACE svc/prometheus-stack-kube-prom-prometheus 9090:9090"
    echo "  URL: http://localhost:9090"
    echo ""
    echo "🚨 Alertmanager:"
    echo "  kubectl port-forward -n $MONITORING_NAMESPACE svc/prometheus-stack-kube-prom-alertmanager 9093:9093"
    echo "  URL: http://localhost:9093"
    echo ""
    echo "📝 Logs (Loki):"
    echo "  kubectl port-forward -n $MONITORING_NAMESPACE svc/loki 3100:3100"
    echo "  URL: http://localhost:3100"
    echo ""
}

main() {
    log "🚀 Setting up monitoring for FANZ AI Ecosystem..."
    
    check_prerequisites
    setup_namespaces
    install_prometheus_operator
    setup_service_monitors
    create_alerting_rules
    create_custom_dashboards
    setup_log_aggregation
    create_monitoring_dashboard_configmap
    
    success "🎉 Monitoring setup completed successfully!"
    display_access_info
    
    log "Setup completed in $(($SECONDS / 60)) minutes"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        --monitoring-namespace)
            MONITORING_NAMESPACE="$2"
            shift 2
            ;;
        --grafana-password)
            GRAFANA_PASSWORD="$2"
            shift 2
            ;;
        --slack-webhook)
            SLACK_WEBHOOK="$2"
            shift 2
            ;;
        --email)
            EMAIL_RECIPIENT="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --namespace NS               Application namespace (default: fanz-ai-ecosystem)"
            echo "  --monitoring-namespace NS    Monitoring namespace (default: monitoring)"
            echo "  --grafana-password PASS      Grafana admin password"
            echo "  --slack-webhook URL          Slack webhook for alerts"
            echo "  --email ADDRESS              Email address for alerts"
            echo "  --help                       Show this help message"
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
done

# Handle script interruption
trap 'error "Monitoring setup interrupted"' INT TERM

# Run main function
main