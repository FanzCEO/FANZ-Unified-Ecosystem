# FANZ Unified Ecosystem - Terraform Variables for Scaleway

# General Configuration
variable "environment" {
  description = "Environment name (development, staging, production)"
  type        = string
  default     = "production"
  
  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be development, staging, or production."
  }
}

variable "region" {
  description = "Scaleway region"
  type        = string
  default     = "fr-par"
  
  validation {
    condition = contains([
      "fr-par", "nl-ams", "pl-waw"
    ], var.region)
    error_message = "Region must be a valid Scaleway region."
  }
}

variable "zone" {
  description = "Scaleway zone"
  type        = string
  default     = "fr-par-1"
  
  validation {
    condition = contains([
      "fr-par-1", "fr-par-2", "fr-par-3",
      "nl-ams-1", "nl-ams-2", "nl-ams-3",
      "pl-waw-1", "pl-waw-2", "pl-waw-3"
    ], var.zone)
    error_message = "Zone must be a valid Scaleway zone."
  }
}

# Kubernetes Configuration
variable "kubernetes_version" {
  description = "Kubernetes version for the cluster"
  type        = string
  default     = "1.28"
}

# General Node Pool Configuration
variable "node_type_general" {
  description = "Instance type for general workloads"
  type        = string
  default     = "GP1-M" # 4 vCPU, 16GB RAM - balanced for FANZ services
}

variable "node_count_general" {
  description = "Initial number of nodes in general pool"
  type        = number
  default     = 3
}

variable "node_min_general" {
  description = "Minimum nodes in general pool"
  type        = number
  default     = 2
}

variable "node_max_general" {
  description = "Maximum nodes in general pool"
  type        = number
  default     = 10
}

# Compute-Intensive Node Pool Configuration
variable "node_type_compute" {
  description = "Instance type for compute-intensive workloads (AI, video processing)"
  type        = string
  default     = "GP1-L" # 8 vCPU, 32GB RAM - for AI processing
}

variable "node_count_compute" {
  description = "Initial number of nodes in compute pool"
  type        = number
  default     = 2
}

variable "node_min_compute" {
  description = "Minimum nodes in compute pool"
  type        = number
  default     = 1
}

variable "node_max_compute" {
  description = "Maximum nodes in compute pool"
  type        = number
  default     = 5
}

# Database Configuration
variable "postgres_node_type" {
  description = "PostgreSQL instance type"
  type        = string
  default     = "DB-GP-M" # 4 vCPU, 16GB RAM, 150GB storage
}

variable "postgres_username" {
  description = "PostgreSQL master username"
  type        = string
  default     = "fanz_admin"
  sensitive   = true
}

variable "postgres_password" {
  description = "PostgreSQL master password"
  type        = string
  sensitive   = true
}

# Redis Configuration
variable "redis_node_type" {
  description = "Redis instance type"
  type        = string
  default     = "RED1-M" # 4GB RAM
}

variable "redis_cluster_size" {
  description = "Number of nodes in Redis cluster"
  type        = number
  default     = 3
}

variable "redis_username" {
  description = "Redis username"
  type        = string
  default     = "fanz_redis"
  sensitive   = true
}

variable "redis_password" {
  description = "Redis password"
  type        = string
  sensitive   = true
}

# Load Balancer Configuration
variable "lb_type" {
  description = "Load balancer type"
  type        = string
  default     = "LB-GP-M" # General purpose medium load balancer
  
  validation {
    condition = contains([
      "LB-GP-S", "LB-GP-M", "LB-GP-L"
    ], var.lb_type)
    error_message = "Load balancer type must be LB-GP-S, LB-GP-M, or LB-GP-L."
  }
}

# Domain and SSL Configuration
variable "domain_name" {
  description = "Primary domain name for FANZ ecosystem"
  type        = string
  default     = "fanz.network"
}

variable "subdomains" {
  description = "List of subdomains for different FANZ platforms"
  type        = list(string)
  default = [
    "boyfanz.com",
    "girlfanz.com", 
    "pupfanz.com",
    "taboofanz.com",
    "api.fanz.network",
    "admin.fanz.network",
    "cdn.fanz.network"
  ]
}

# Compliance and Legal
variable "enable_compliance_logging" {
  description = "Enable enhanced logging for compliance requirements"
  type        = bool
  default     = true
}

variable "gdpr_compliance" {
  description = "Enable GDPR compliance features"
  type        = bool
  default     = true
}

variable "enable_adult_content_protection" {
  description = "Enable adult content protection and age verification"
  type        = bool
  default     = true
}

# Backup and Retention
variable "backup_retention_days" {
  description = "Number of days to retain backups (7 years for adult industry compliance)"
  type        = number
  default     = 2555 # 7 years
}

# Monitoring and Alerting
variable "enable_monitoring" {
  description = "Enable comprehensive monitoring and alerting"
  type        = bool
  default     = true
}

variable "alert_email" {
  description = "Email address for critical alerts"
  type        = string
  default     = "alerts@fanz.network"
}

# Security Configuration
variable "enable_network_encryption" {
  description = "Enable network encryption between services"
  type        = bool
  default     = true
}

variable "enable_audit_logging" {
  description = "Enable comprehensive audit logging"
  type        = bool
  default     = true
}

# Auto-scaling Configuration
variable "enable_autoscaling" {
  description = "Enable auto-scaling for node pools"
  type        = bool
  default     = true
}

variable "scale_up_threshold_cpu" {
  description = "CPU threshold for scaling up (percentage)"
  type        = number
  default     = 70
}

variable "scale_down_threshold_cpu" {
  description = "CPU threshold for scaling down (percentage)"
  type        = number
  default     = 30
}

# Cost Optimization
variable "enable_spot_instances" {
  description = "Enable spot instances for non-critical workloads"
  type        = bool
  default     = false # Disabled for production stability
}

variable "enable_resource_quotas" {
  description = "Enable resource quotas to prevent cost overruns"
  type        = bool
  default     = true
}

# Development and Testing
variable "enable_debug_mode" {
  description = "Enable debug mode for development environments"
  type        = bool
  default     = false
}

variable "deploy_test_services" {
  description = "Deploy additional test services"
  type        = bool
  default     = false
}