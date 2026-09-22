locals {
  common_tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
  prefix = "${var.project}-${var.environment}"
}
