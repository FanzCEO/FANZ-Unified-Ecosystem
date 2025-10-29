# FANZ Unified Ecosystem - Scaleway Infrastructure
# Production-grade deployment for adult content platform with compliance

terraform {
  required_version = ">= 1.0"
  required_providers {
    scaleway = {
      source  = "scaleway/scaleway"
      version = "~> 2.25"
    }
  }
  
  # Remote state storage on Scaleway Object Storage
  backend "s3" {
    bucket                      = "fanz-terraform-state"
    key                        = "production/terraform.tfstate"
    region                     = "fr-par"
    endpoint                   = "https://s3.fr-par.scw.cloud"
    skip_credentials_validation = true
    skip_region_validation     = true
  }
}

# Configure Scaleway provider
provider "scaleway" {
  zone   = var.zone
  region = var.region
}

# Local variables
locals {
  project_name = "fanz-ecosystem"
  environment  = var.environment
  tags = {
    Project     = "FANZ-Unified-Ecosystem"
    Environment = var.environment
    Owner       = "FANZ-Team"
    Compliance  = "Adult-Content-Approved"
    ManagedBy   = "Terraform"
  }
}

# VPC and Networking
resource "scaleway_vpc" "fanz_vpc" {
  name = "${local.project_name}-vpc-${local.environment}"
  tags = local.tags
}

resource "scaleway_vpc_private_network" "fanz_private_network" {
  name   = "${local.project_name}-private-network"
  vpc_id = scaleway_vpc.fanz_vpc.id
  tags   = local.tags
}

# Security Groups
resource "scaleway_instance_security_group" "fanz_web_sg" {
  name                    = "${local.project_name}-web-sg"
  description             = "Security group for FANZ web services"
  inbound_default_policy  = "drop"
  outbound_default_policy = "accept"

  inbound_rule {
    action   = "accept"
    port     = 80
    protocol = "TCP"
    ip_range = "0.0.0.0/0"
  }

  inbound_rule {
    action   = "accept"
    port     = 443
    protocol = "TCP"
    ip_range = "0.0.0.0/0"
  }

  inbound_rule {
    action   = "accept"
    port     = 22
    protocol = "TCP"
    ip_range = "10.0.0.0/8"
  }

  tags = local.tags
}

resource "scaleway_instance_security_group" "fanz_database_sg" {
  name                    = "${local.project_name}-database-sg"
  description             = "Security group for FANZ databases"
  inbound_default_policy  = "drop"
  outbound_default_policy = "accept"

  inbound_rule {
    action                = "accept"
    port                  = 5432
    protocol              = "TCP"
    security_group_id     = scaleway_instance_security_group.fanz_web_sg.id
  }

  inbound_rule {
    action                = "accept"
    port                  = 6379
    protocol              = "TCP"
    security_group_id     = scaleway_instance_security_group.fanz_web_sg.id
  }

  tags = local.tags
}

# Kubernetes Cluster (Kapsule)
resource "scaleway_k8s_cluster" "fanz_cluster" {
  name    = "${local.project_name}-cluster"
  version = var.kubernetes_version
  cni     = "cilium"
  
  # Enable auto-upgrade for security patches
  auto_upgrade {
    enable                        = true
    maintenance_window_start_hour = 3
    maintenance_window_day        = "sunday"
  }

  # Enable OpenID Connect for authentication
  open_id_connect_config {
    issuer_url      = "https://accounts.fanz.network"
    client_id       = "fanz-k8s-cluster"
    username_claim  = "email"
    username_prefix = "fanz:"
    groups_claim    = ["groups"]
    groups_prefix   = "fanz:"
  }

  # Private cluster for enhanced security
  private_network_id = scaleway_vpc_private_network.fanz_private_network.id
  
  tags = local.tags
}

# Node pools for different workloads
resource "scaleway_k8s_pool" "fanz_general_pool" {
  cluster_id = scaleway_k8s_cluster.fanz_cluster.id
  name       = "general-pool"
  node_type  = var.node_type_general
  size       = var.node_count_general
  
  min_size = var.node_min_general
  max_size = var.node_max_general
  
  autoscaling = true
  autohealing = true
  
  tags = merge(local.tags, {
    NodePool = "general"
  })
}

resource "scaleway_k8s_pool" "fanz_compute_pool" {
  cluster_id = scaleway_k8s_cluster.fanz_cluster.id
  name       = "compute-intensive-pool"
  node_type  = var.node_type_compute
  size       = var.node_count_compute
  
  min_size = var.node_min_compute
  max_size = var.node_max_compute
  
  autoscaling = true
  autohealing = true
  
  tags = merge(local.tags, {
    NodePool = "compute-intensive"
  })
}

# Managed PostgreSQL Database
resource "scaleway_rdb_instance" "fanz_postgres" {
  name           = "${local.project_name}-postgres"
  node_type      = var.postgres_node_type
  engine         = "PostgreSQL-15"
  is_ha_cluster  = var.environment == "production" ? true : false
  disable_backup = false
  
  # Backup configuration
  backup_schedule_frequency = 24 # Daily backups
  backup_schedule_retention = 7  # Keep for 7 days
  
  user_name = var.postgres_username
  password  = var.postgres_password
  
  private_network {
    pn_id = scaleway_vpc_private_network.fanz_private_network.id
  }

  tags = merge(local.tags, {
    Service = "PostgreSQL"
  })
}

# Managed Redis
resource "scaleway_redis_cluster" "fanz_redis" {
  name         = "${local.project_name}-redis"
  version      = "7.0.5"
  node_type    = var.redis_node_type
  cluster_size = var.redis_cluster_size
  
  user_name = var.redis_username
  password  = var.redis_password
  
  private_network {
    id = scaleway_vpc_private_network.fanz_private_network.id
  }

  tags = merge(local.tags, {
    Service = "Redis"
  })
}

# Object Storage for media files
resource "scaleway_object_bucket" "fanz_media" {
  name   = "${local.project_name}-media-${local.environment}"
  acl    = "private"
  
  cors_rule {
    allowed_origins = ["https://*.fanz.network", "https://*.boyfanz.com", "https://*.girlfanz.com", "https://*.pupfanz.com"]
    allowed_methods = ["GET", "POST", "PUT", "DELETE"]
    allowed_headers = ["*"]
    max_age_seconds = 3600
  }
  
  lifecycle_rule {
    id      = "media_lifecycle"
    enabled = true
    
    expiration {
      days = 2555 # 7 years for compliance
    }
    
    transitions {
      days          = 90
      storage_class = "GLACIER"
    }
  }

  tags = merge(local.tags, {
    Service = "Media-Storage"
  })
}

resource "scaleway_object_bucket" "fanz_backups" {
  name   = "${local.project_name}-backups-${local.environment}"
  acl    = "private"
  
  lifecycle_rule {
    id      = "backup_lifecycle"
    enabled = true
    
    expiration {
      days = 2555 # 7 years for compliance
    }
  }

  tags = merge(local.tags, {
    Service = "Backups"
  })
}

# Load Balancer
resource "scaleway_lb" "fanz_lb" {
  name = "${local.project_name}-lb"
  type = var.lb_type
  
  private_network {
    private_network_id = scaleway_vpc_private_network.fanz_private_network.id
  }

  tags = local.tags
}

resource "scaleway_lb_ip" "fanz_lb_ip" {
  lb_id = scaleway_lb.fanz_lb.id
}

# Container Registry
resource "scaleway_registry_namespace" "fanz_registry" {
  name        = "${local.project_name}-registry"
  description = "Container registry for FANZ ecosystem microservices"
  is_public   = false

  tags = merge(local.tags, {
    Service = "Container-Registry"
  })
}

# Output values
output "cluster_kubeconfig" {
  description = "Kubernetes cluster configuration"
  value       = scaleway_k8s_cluster.fanz_cluster.kubeconfig[0].config_file
  sensitive   = true
}

output "postgres_endpoint" {
  description = "PostgreSQL connection endpoint"
  value       = scaleway_rdb_instance.fanz_postgres.endpoint_ip
  sensitive   = true
}

output "redis_endpoint" {
  description = "Redis connection endpoint"
  value       = scaleway_redis_cluster.fanz_redis.certificate
  sensitive   = true
}

output "media_bucket" {
  description = "Media storage bucket name"
  value       = scaleway_object_bucket.fanz_media.name
}

output "load_balancer_ip" {
  description = "Load balancer public IP"
  value       = scaleway_lb_ip.fanz_lb_ip.ip_address
}

output "registry_endpoint" {
  description = "Container registry endpoint"
  value       = scaleway_registry_namespace.fanz_registry.endpoint
}