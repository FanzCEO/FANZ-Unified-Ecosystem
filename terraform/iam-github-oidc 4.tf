# GitHub OIDC Provider for GitHub Actions
resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]

  tags = merge(local.common_tags, {
    Name = "${local.cluster_name}-github-oidc"
  })
}

# IAM Role for GitHub Actions to assume for health monitoring
resource "aws_iam_role" "gh_oidc_observability" {
  name = "gh-oidc-observability"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = [
              "repo:FANZ-YourOrg/FANZ-Unified-Ecosystem:ref:refs/heads/main",
              "repo:FANZ-YourOrg/FANZ-Unified-Ecosystem:ref:refs/tags/*"
            ]
          }
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.cluster_name}-gh-observability"
  })
}

# Custom policy for EKS read access
resource "aws_iam_role_policy" "eks_read" {
  name = "EKSReadAccess"
  role = aws_iam_role.gh_oidc_observability.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "eks:DescribeCluster",
          "eks:ListClusters",
          "eks:DescribeNodegroup",
          "eks:ListNodegroups",
          "eks:DescribeFargateProfile",
          "eks:ListFargateProfiles",
          "eks:DescribeUpdate",
          "eks:ListUpdates"
        ]
        Resource = "*"
      }
    ]
  })
}

# Policy for CloudWatch read access
resource "aws_iam_role_policy_attachment" "cw_read" {
  role       = aws_iam_role.gh_oidc_observability.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchReadOnlyAccess"
}

# Policy for security audit access
resource "aws_iam_role_policy_attachment" "security_audit" {
  role       = aws_iam_role.gh_oidc_observability.name
  policy_arn = "arn:aws:iam::aws:policy/SecurityAudit"
}

# Custom policy for Inspector and GuardDuty access
resource "aws_iam_role_policy" "inspector_guardduty" {
  name = "InspectorGuardDutyAccess"
  role = aws_iam_role.gh_oidc_observability.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "inspector2:ListFindings",
          "inspector2:GetFindings", 
          "inspector2:ListUsageStatistics",
          "guardduty:ListDetectors",
          "guardduty:ListFindings",
          "guardduty:GetFindings",
          "guardduty:GetUsageStatistics"
        ]
        Resource = "*"
      }
    ]
  })
}

# Output the role ARN for use in GitHub Actions
output "github_oidc_role_arn" {
  description = "ARN of the GitHub OIDC role for health monitoring"
  value       = aws_iam_role.gh_oidc_observability.arn
}