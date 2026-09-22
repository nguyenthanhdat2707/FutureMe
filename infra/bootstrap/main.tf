terraform {
  required_version = "~> 1.15.9"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "aws_region" {
  type    = string
  default = "ap-southeast-1"
}

provider "aws" {
  region              = var.aws_region
  allowed_account_ids = ["728033416182"]
}

data "aws_caller_identity" "current" {}

locals {
  bucket_name = "future-me-tfstate-728033416182"
  # This repository uses GitHub's immutable owner/repository ID OIDC subject
  # format. Binding to IDs also prevents a renamed repository from inheriting
  # this trust relationship by reusing the previous owner/repository names.
  github_oidc_repository = "nguyenthanhdat2707@154571295/FutureMe@1377472785"
  state_key              = "future-me/app/terraform.tfstate"
}

resource "aws_s3_bucket" "terraform_state" {
  bucket = local.bucket_name

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket                  = aws_s3_bucket.terraform_state.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "terraform_state_tls" {
  bucket = aws_s3_bucket.terraform_state.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "EnforceTLS"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.terraform_state.arn,
          "${aws_s3_bucket.terraform_state.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

resource "aws_s3_bucket_lifecycle_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  rule {
    id     = "expire_old_versions"
    status = "Enabled"
    filter {}
    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

# GitHub OIDC Provider
resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1", "1c58a3a8518e8759bf075b76b750d4f2df264fcd"]
}

# Plan Role
resource "aws_iam_role" "github_plan_role" {
  name = "future-me-github-plan"
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
            "token.actions.githubusercontent.com:sub" = "repo:${local.github_oidc_repository}:pull_request"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "plan_state" {
  name = "terraform-state-access"
  role = aws_iam_role.github_plan_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = [aws_s3_bucket.terraform_state.arn]
        Condition = {
          StringLike = {
            "s3:prefix" = ["future-me/app/*"]
          }
        }
      },
      {
        Effect = "Allow"
        Action = ["s3:GetObject"]
        Resource = [
          "${aws_s3_bucket.terraform_state.arn}/${local.state_key}",
          "${aws_s3_bucket.terraform_state.arn}/${local.state_key}.tflock"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "${aws_s3_bucket.terraform_state.arn}/${local.state_key}.tflock"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "apigateway:GET",
          "logs:DescribeLogGroups"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "cognito-idp:DescribeUserPool", "cognito-idp:DescribeUserPoolClient", "cognito-idp:ListTagsForResource",
          "dynamodb:DescribeTable", "dynamodb:ListTagsOfResource",
          "iam:GetRole", "iam:GetRolePolicy", "iam:ListRolePolicies", "iam:ListAttachedRolePolicies",
          "lambda:GetFunction", "lambda:GetFunctionConfiguration", "lambda:ListTags",
          "logs:ListTagsForResource"
        ]
        Resource = [
          "arn:aws:cognito-idp:${var.aws_region}:${data.aws_caller_identity.current.account_id}:userpool/*",
          "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/future-me-*",
          "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/future-me-prod-lambda-role",
          "arn:aws:lambda:${var.aws_region}:${data.aws_caller_identity.current.account_id}:function:future-me-*",
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/future-me-*",
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/apigateway/future-me-*"
        ]
      }
    ]
  })
}


# Apply Role
resource "aws_iam_role" "github_apply_role" {
  name = "future-me-github-apply"
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
            "token.actions.githubusercontent.com:sub" = "repo:${local.github_oidc_repository}:ref:refs/heads/main"
          }
        }
      }
    ]
  })
}

# This broad policy is an explicit operator decision for the manual main-branch apply workflow.
resource "aws_iam_role_policy_attachment" "apply_admin" {
  role       = aws_iam_role.github_apply_role.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

resource "aws_iam_role_policy" "apply_permissions" {
  name = "terraform-manage-resources"
  role = aws_iam_role.github_apply_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = [aws_s3_bucket.terraform_state.arn]
        Condition = {
          StringLike = {
            "s3:prefix" = ["future-me/app/*"]
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "${aws_s3_bucket.terraform_state.arn}/${local.state_key}",
          "${aws_s3_bucket.terraform_state.arn}/${local.state_key}.tflock"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "iam:PassRole"
        ]
        Resource = [
          "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/future-me-prod-lambda-role"
        ]
        Condition = {
          StringEquals = {
            "iam:PassedToService" = "lambda.amazonaws.com"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "apigateway:GET", "apigateway:POST", "apigateway:PUT", "apigateway:PATCH", "apigateway:DELETE",
          "cognito-idp:CreateUserPool", "cognito-idp:DescribeUserPool",
          "dynamodb:CreateTable",
          "lambda:CreateFunction",
          "logs:CreateLogGroup", "logs:DescribeLogGroups"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "iam:CreateRole", "iam:DeleteRole", "iam:PutRolePolicy", "iam:DeleteRolePolicy", "iam:GetRole", "iam:GetRolePolicy", "iam:ListRolePolicies", "iam:ListAttachedRolePolicies", "iam:TagRole", "iam:UntagRole",
          "cognito-idp:DeleteUserPool", "cognito-idp:UpdateUserPool", "cognito-idp:CreateUserPoolClient", "cognito-idp:DeleteUserPoolClient", "cognito-idp:UpdateUserPoolClient", "cognito-idp:DescribeUserPoolClient", "cognito-idp:TagResource", "cognito-idp:UntagResource", "cognito-idp:ListTagsForResource", "cognito-idp:SetRiskConfiguration", "cognito-idp:SetUserPoolMfaConfig",
          "dynamodb:DeleteTable", "dynamodb:UpdateTable", "dynamodb:DescribeTable", "dynamodb:TagResource", "dynamodb:UntagResource", "dynamodb:ListTagsOfResource",
          "lambda:UpdateFunctionCode", "lambda:UpdateFunctionConfiguration", "lambda:DeleteFunction", "lambda:GetFunction", "lambda:GetFunctionConfiguration", "lambda:ListTags", "lambda:TagResource", "lambda:UntagResource", "lambda:AddPermission", "lambda:RemovePermission",
          "logs:DeleteLogGroup", "logs:PutRetentionPolicy", "logs:ListTagsForResource", "logs:TagResource", "logs:UntagResource"
        ]
        Resource = [
          "arn:aws:apigateway:${var.aws_region}::/*",
          "arn:aws:cognito-idp:${var.aws_region}:${data.aws_caller_identity.current.account_id}:userpool/*",
          "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/future-me-*",
          "arn:aws:lambda:${var.aws_region}:${data.aws_caller_identity.current.account_id}:function:future-me-*",
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/future-me-*",
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/apigateway/future-me-*",
          "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/future-me-prod-lambda-role"
        ]
      }
    ]
  })
}
