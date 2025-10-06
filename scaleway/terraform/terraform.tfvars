# FANZ Unified Ecosystem - Production Configuration
# Scaleway Infrastructure Variables

# Environment Configuration
environment = "production"
region      = "fr-par"
zone        = "fr-par-1"

# Kubernetes Configuration
kubernetes_version = "1.28"

# Node Pool Configuration - Optimized for FANZ workloads
node_type_general = "GP1-L"  # 8 vCPU, 32GB RAM for production
node_count_general = 5       # Higher count for production traffic
node_min_general = 3
node_max_general = 20        # Allow for high traffic scaling

# Compute-Intensive Pool for AI and Media Processing
node_type_compute = "GP1-XL"  # 16 vCPU, 64GB RAM for AI workloads
node_count_compute = 3
node_min_compute = 2
node_max_compute = 10

# Database Configuration - High Availability
postgres_node_type = "DB-GP-L"  # 8 vCPU, 32GB RAM, 500GB storage
postgres_username = "fanz_production_admin"

# Redis Configuration - Cluster mode for performance
redis_node_type = "RED1-L"      # 8GB RAM
redis_cluster_size = 6          # Cluster with replicas
redis_username = "fanz_redis_prod"

# Load Balancer Configuration
lb_type = "LB-GP-L"  # Large load balancer for production traffic

# Domain Configuration
domain_name = "fanz.network"
subdomains = [
  "boyfanz.com",
  "girlfanz.com",
  "pupfanz.com",
  "daddiesfanz.com",
  "cougarfanz.com", 
  "taboofanz.com",
  "api.fanz.network",
  "admin.fanz.network",
  "cdn.fanz.network",
  "dash.fanz.network",
  "media.fanz.network"
]

# Compliance and Legal - Strict Production Settings
enable_compliance_logging = true
gdpr_compliance = true
enable_adult_content_protection = true
backup_retention_days = 2555  # 7 years for Section 2257 compliance

# Monitoring and Alerting
enable_monitoring = true
alert_email = "production-alerts@fanz.network"

# Security Configuration - Maximum Security
enable_network_encryption = true
enable_audit_logging = true

# Auto-scaling Configuration
enable_autoscaling = true
scale_up_threshold_cpu = 60    # Scale up earlier in production
scale_down_threshold_cpu = 25  # Conservative scale down

# Cost Optimization
enable_spot_instances = false     # Reliability over cost for production
enable_resource_quotas = true

# Production Flags
enable_debug_mode = false
deploy_test_services = false