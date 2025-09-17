# FANZ Unified Ecosystem - Terraform Outputs

# Cluster Information
output "cluster_name" {
  description = "Name of the EKS cluster"
  value       = local.cluster_name
}

output "cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = module.eks.cluster_endpoint
}

output "cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster"
  value       = module.eks.cluster_security_group_id
}

output "cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the cluster"
  value       = module.eks.cluster_certificate_authority_data
}

output "cluster_oidc_issuer_url" {
  description = "The URL on the EKS cluster OIDC Issuer"
  value       = module.eks.cluster_oidc_issuer_url
}

output "oidc_provider_arn" {
  description = "The ARN of the OIDC Provider"
  value       = module.eks.oidc_provider_arn
}

# Network Information
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "vpc_cidr_block" {
  description = "The CIDR block of the VPC"
  value       = module.vpc.vpc_cidr_block
}

output "private_subnets" {
  description = "List of IDs of private subnets"
  value       = module.vpc.private_subnets
}

output "public_subnets" {
  description = "List of IDs of public subnets"
  value       = module.vpc.public_subnets
}

output "database_subnets" {
  description = "List of IDs of database subnets"
  value       = module.vpc.database_subnets
}

output "nat_gateway_ips" {
  description = "List of public Elastic IPs created for AWS NAT Gateway"
  value       = module.vpc.nat_public_ips
}

# Database Information
output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = module.rds.db_instance_endpoint
  sensitive   = true
}

output "rds_port" {
  description = "RDS instance port"
  value       = module.rds.db_instance_port
}

output "rds_username" {
  description = "RDS instance master username"
  value       = module.rds.db_instance_username
  sensitive   = true
}

output "rds_database_name" {
  description = "RDS instance database name"
  value       = module.rds.db_instance_name
}

output "rds_replica_endpoint" {
  description = "RDS replica endpoint"
  value       = var.environment == "production" ? aws_db_instance.replica[0].endpoint : null
  sensitive   = true
}

# Redis Information
output "redis_endpoint" {
  description = "Redis primary endpoint"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
  sensitive   = true
}

output "redis_port" {
  description = "Redis port"
  value       = aws_elasticache_replication_group.redis.port
}

output "redis_reader_endpoint" {
  description = "Redis reader endpoint"
  value       = aws_elasticache_replication_group.redis.reader_endpoint_address
  sensitive   = true
}

# S3 Information
output "media_bucket_name" {
  description = "Name of the S3 media storage bucket"
  value       = aws_s3_bucket.media_storage.id
}

output "media_bucket_arn" {
  description = "ARN of the S3 media storage bucket"
  value       = aws_s3_bucket.media_storage.arn
}

output "logs_bucket_name" {
  description = "Name of the S3 logs bucket"
  value       = aws_s3_bucket.logs.id
}

output "backups_bucket_name" {
  description = "Name of the S3 backups bucket"
  value       = aws_s3_bucket.backups.id
}

# CloudFront Information
output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.media_cdn.id
}

output "cloudfront_distribution_domain_name" {
  description = "Domain name corresponding to the distribution"
  value       = aws_cloudfront_distribution.media_cdn.domain_name
}

output "cloudfront_distribution_hosted_zone_id" {
  description = "CloudFront Route 53 zone ID"
  value       = aws_cloudfront_distribution.media_cdn.hosted_zone_id
}

# Load Balancer Information
output "load_balancer_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "load_balancer_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "load_balancer_hosted_zone_id" {
  description = "Hosted zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

# Security Information
output "waf_web_acl_id" {
  description = "ID of the WAF Web ACL for ALB"
  value       = var.enable_waf ? aws_wafv2_web_acl.main[0].id : null
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL for ALB"
  value       = var.enable_waf ? aws_wafv2_web_acl.main[0].arn : null
}

output "cloudfront_waf_web_acl_id" {
  description = "ID of the WAF Web ACL for CloudFront"
  value       = var.enable_waf ? aws_wafv2_web_acl.cloudfront[0].id : null
}

# KMS Keys
output "eks_kms_key_id" {
  description = "ID of the KMS key for EKS"
  value       = aws_kms_key.eks.id
}

output "rds_kms_key_id" {
  description = "ID of the KMS key for RDS"
  value       = aws_kms_key.rds.id
}

output "s3_kms_key_id" {
  description = "ID of the KMS key for S3"
  value       = aws_kms_key.s3.id
}

output "vault_kms_key_id" {
  description = "ID of the KMS key for Vault auto-unseal"
  value       = aws_kms_key.vault.id
}

output "vault_kms_key_arn" {
  description = "ARN of the KMS key for Vault auto-unseal"
  value       = aws_kms_key.vault.arn
}

# Secrets Manager
output "database_password_secret_arn" {
  description = "ARN of the database password secret"
  value       = aws_secretsmanager_secret.database_password.arn
  sensitive   = true
}

output "redis_auth_secret_arn" {
  description = "ARN of the Redis auth token secret"
  value       = aws_secretsmanager_secret.redis_auth.arn
  sensitive   = true
}

# Route53
output "hosted_zone_id" {
  description = "Route53 hosted zone ID"
  value       = var.hosted_zone_id
}

output "domain_name" {
  description = "Primary domain name"
  value       = var.domain_name
}

# Node Groups
output "eks_managed_node_groups" {
  description = "Map of EKS managed node groups"
  value       = {
    for name, group in module.eks.eks_managed_node_groups : name => {
      node_group_arn           = group.node_group_arn
      node_group_status        = group.node_group_status
      instance_types          = var.node_groups[name].instance_types
    }
  }
}

# Security Groups
output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "rds_security_group_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

output "redis_security_group_id" {
  description = "ID of the Redis security group"
  value       = aws_security_group.redis.id
}

# GuardDuty
output "guardduty_detector_id" {
  description = "ID of the GuardDuty detector"
  value       = var.enable_guardduty ? aws_guardduty_detector.main[0].id : null
}

# Deployment Information
output "deployment_region" {
  description = "AWS region"
  value       = var.aws_region
}

output "deployment_environment" {
  description = "Environment name"
  value       = var.environment
}

output "aws_account_id" {
  description = "AWS account ID"
  value       = data.aws_caller_identity.current.account_id
}

# FANZ Platform Specific
output "platform_urls" {
  description = "Platform URLs for FANZ services"
  value = {
    api_gateway    = "api.${var.domain_name}"
    auth_service   = "auth.${var.domain_name}"
    dash_security  = "dash.${var.domain_name}"
    landing_portal = "landing.${var.domain_name}"
    media_core     = "media.${var.domain_name}"
    social         = "social.${var.domain_name}"
    tube           = "tube.${var.domain_name}"
    commerce       = "commerce.${var.domain_name}"
    spicy_ai       = "spicyai.${var.domain_name}"
    affiliate      = "affiliate.${var.domain_name}"
    nft            = "nft.${var.domain_name}"
    club           = "club.${var.domain_name}"
    migrate        = "migrate.${var.domain_name}"
    core           = "core.${var.domain_name}"
    vault          = "vault.${var.domain_name}"
    grafana        = "grafana.${var.domain_name}"
    logs           = "logs.${var.domain_name}"
  }
}

# kubectl Configuration Command
output "kubectl_config_command" {
  description = "Command to configure kubectl"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${local.cluster_name}"
}

# Summary Information
output "deployment_summary" {
  description = "Deployment summary information"
  value = {
    cluster_name     = local.cluster_name
    domain_name      = var.domain_name
    environment      = var.environment
    region          = var.aws_region
    vpc_cidr        = var.vpc_cidr
    kubernetes_version = var.kubernetes_version
    node_groups     = keys(var.node_groups)
    s3_buckets      = [
      aws_s3_bucket.media_storage.id,
      aws_s3_bucket.logs.id,
      aws_s3_bucket.backups.id
    ]
    security_features = {
      waf_enabled        = var.enable_waf
      guardduty_enabled  = var.enable_guardduty
      vpc_flow_logs      = var.enable_vpc_flow_logs
      encryption_at_rest = true
      encryption_in_transit = true
    }
  }
}