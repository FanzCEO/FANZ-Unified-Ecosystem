# FANZ Unified Ecosystem - Terraform Variables

# Project Configuration
variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "fz"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "domain_name" {
  description = "Primary domain name for the platform"
  type        = string
  default     = "myfanz.network"
}

variable "hosted_zone_id" {
  description = "Route53 hosted zone ID for the domain"
  type        = string
  default     = "Z06989421UHN5VI9NT08T"
}

# Network Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.4.0/24", "10.0.5.0/24", "10.0.6.0/24"]
}

variable "database_subnet_cidrs" {
  description = "CIDR blocks for database subnets"
  type        = list(string)
  default     = ["10.0.7.0/24", "10.0.8.0/24", "10.0.9.0/24"]
}

# EKS Configuration
variable "kubernetes_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.28"
}

variable "node_groups" {
  description = "EKS node group configurations"
  type = map(object({
    instance_types = list(string)
    min_size       = number
    max_size       = number
    desired_size   = number
    disk_size      = number
    disk_type      = string
    labels         = map(string)
    taints         = list(object({
      key    = string
      value  = string
      effect = string
    }))
  }))
  default = {
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
}

# RDS Configuration
variable "database_name" {
  description = "Name of the main database"
  type        = string
  default     = "fanz_unified"
}

variable "database_username" {
  description = "Username for the database"
  type        = string
  default     = "fanz_user"
}

variable "database_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.r6g.2xlarge"
}

variable "database_allocated_storage" {
  description = "Allocated storage for RDS in GB"
  type        = number
  default     = 500
}

variable "database_max_allocated_storage" {
  description = "Maximum allocated storage for RDS in GB"
  type        = number
  default     = 2000
}

variable "database_backup_retention_period" {
  description = "Database backup retention period in days"
  type        = number
  default     = 30
}

# Redis Configuration
variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.r7g.xlarge"
}

variable "redis_num_cache_clusters" {
  description = "Number of cache clusters in the replication group"
  type        = number
  default     = 3
}

variable "redis_parameter_group_name" {
  description = "Redis parameter group name"
  type        = string
  default     = "default.redis7"
}

# S3 Configuration
variable "media_bucket_name" {
  description = "Name of the S3 bucket for media storage"
  type        = string
  default     = ""
}

variable "logs_bucket_name" {
  description = "Name of the S3 bucket for logs"
  type        = string
  default     = ""
}

variable "backup_bucket_name" {
  description = "Name of the S3 bucket for backups"
  type        = string
  default     = ""
}

# CloudFront Configuration
variable "cloudfront_price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_All"
}

variable "cloudfront_compress" {
  description = "Whether CloudFront should compress content"
  type        = bool
  default     = true
}

# Monitoring Configuration
variable "enable_cloudwatch" {
  description = "Enable CloudWatch monitoring"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

# Security Configuration
variable "enable_waf" {
  description = "Enable AWS WAF"
  type        = bool
  default     = true
}

variable "enable_vpc_flow_logs" {
  description = "Enable VPC Flow Logs"
  type        = bool
  default     = true
}

variable "enable_guardduty" {
  description = "Enable GuardDuty"
  type        = bool
  default     = true
}

# Tags
variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# Certificate Configuration
variable "certificate_domain_validation_options" {
  description = "Domain validation options for SSL certificate"
  type        = map(string)
  default     = {}
}

# Payment Processor Configuration (Adult-industry compliant)
variable "payment_processors" {
  description = "Approved adult-industry payment processors"
  type = map(object({
    name        = string
    environment = string
    enabled     = bool
  }))
  default = {
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
}