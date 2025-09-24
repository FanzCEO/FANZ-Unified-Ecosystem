# FANZ Unified Ecosystem - Production Environment Variables

# Project Configuration
project_name = "fz"
environment = "prod"
aws_region = "us-east-1"
domain_name = "myfanz.network"
hosted_zone_id = "Z06989421UHN5VI9NT08T"

# Network Configuration
vpc_cidr = "10.0.0.0/16"
public_subnet_cidrs = [
  "10.0.1.0/24",  # us-east-1a
  "10.0.2.0/24",  # us-east-1b
  "10.0.3.0/24"   # us-east-1c
]
private_subnet_cidrs = [
  "10.0.4.0/24",  # us-east-1a
  "10.0.5.0/24",  # us-east-1b
  "10.0.6.0/24"   # us-east-1c
]
database_subnet_cidrs = [
  "10.0.7.0/24",  # us-east-1a
  "10.0.8.0/24",  # us-east-1b
  "10.0.9.0/24"   # us-east-1c
]

# EKS Configuration
kubernetes_version = "1.28"
node_groups = {
  general = {
    instance_types = ["t3.large", "t3.xlarge"]
    min_size       = 3
    max_size       = 20
    desired_size   = 6
    disk_size      = 100
    disk_type      = "gp3"
    labels         = { role = "general" }
    taints         = []
  }
  ai_ml = {
    instance_types = ["c5.2xlarge", "c5.4xlarge"]
    min_size       = 1
    max_size       = 10
    desired_size   = 2
    disk_size      = 200
    disk_type      = "gp3"
    labels         = { role = "ai-ml" }
    taints         = []
  }
  database = {
    instance_types = ["r5.xlarge", "r5.2xlarge"]
    min_size       = 2
    max_size       = 6
    desired_size   = 3
    disk_size      = 500
    disk_type      = "gp3"
    labels         = { role = "database" }
    taints = [{
      key    = "node-type"
      value  = "database"
      effect = "NO_SCHEDULE"
    }]
  }
}

# RDS Configuration
database_name = "fanz_unified"
database_username = "fanz_user"
database_instance_class = "db.r6g.2xlarge"
database_allocated_storage = 500
database_max_allocated_storage = 2000
database_backup_retention_period = 30

# Redis Configuration
redis_node_type = "cache.r7g.xlarge"
redis_num_cache_clusters = 3
redis_parameter_group_name = "default.redis7"

# S3 Configuration - will be auto-generated with unique names
media_bucket_name = ""
logs_bucket_name = ""
backup_bucket_name = ""

# CloudFront Configuration
cloudfront_price_class = "PriceClass_All"
cloudfront_compress = true

# Monitoring Configuration
enable_cloudwatch = true
log_retention_days = 30

# Security Configuration
enable_waf = true
enable_vpc_flow_logs = true
enable_guardduty = true

# Additional Tags
additional_tags = {
  Owner           = "FANZ-DevOps"
  CostCenter      = "FANZ-Platform"
  Compliance      = "ADA-GDPR-2257"
  BusinessUnit    = "FANZ-Enterprise"
  DataClass       = "Sensitive"
  BackupRequired  = "true"
  Environment     = "production"
}

# Payment Processors (Adult-industry compliant only)
payment_processors = {
  ccbill = {
    name        = "CCBill"
    environment = "production"
    enabled     = true
  }
  paxum = {
    name        = "Paxum"
    environment = "production"
    enabled     = true
  }
  segpay = {
    name        = "SegPay"
    environment = "production"
    enabled     = true
  }
}