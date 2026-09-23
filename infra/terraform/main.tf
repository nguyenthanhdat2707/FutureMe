module "identity" {
  source      = "./modules/identity"
  project     = var.project
  environment = var.environment
}

module "storage" {
  source      = "./modules/storage"
  project     = var.project
  environment = var.environment
}

module "runtime" {
  source                 = "./modules/runtime"
  project                = var.project
  environment            = var.environment
  aws_region             = var.aws_region
  bedrock_model_id       = var.bedrock_model_id
  lambda_memory_mb       = var.lambda_memory_mb
  lambda_timeout_seconds = var.lambda_timeout_seconds
  log_retention_days     = var.log_retention_days
  table_arns             = module.storage.table_arns
  table_names            = module.storage.table_names
  artifact_path          = var.artifact_path
}

module "http-api" {
  source                     = "./modules/http-api"
  project                    = var.project
  environment                = var.environment
  lambda_invoke_arn          = module.runtime.invoke_arn
  lambda_function_name       = module.runtime.function_name
  user_pool_issuer           = module.identity.issuer
  user_pool_client_id        = module.identity.client_id
  allowed_origins            = var.allowed_origins
  api_throttling_rate_limit  = var.api_throttling_rate_limit
  api_throttling_burst_limit = var.api_throttling_burst_limit
  log_retention_days         = var.log_retention_days
}
