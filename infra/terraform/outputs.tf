output "api_base_url" {
  value       = "${module.http-api.api_endpoint}/api"
  description = "The base URL for the API"
}
output "cognito_user_pool_id" {
  value       = module.identity.pool_id
  description = "Cognito User Pool ID"
}
output "cognito_user_pool_client_id" {
  value       = module.identity.client_id
  description = "Cognito User Pool Client ID"
}
output "cognito_region" {
  value       = var.aws_region
  description = "Cognito Region"
}
output "lambda_function_name" {
  value       = module.runtime.function_name
  description = "Lambda Function Name"
}
output "dynamodb_table_names" {
  value       = module.storage.table_names
  description = "DynamoDB Table Names"
}
output "frontend_env_mapping" {
  value = <<EOT
VITE_API_BASE_URL=${module.http-api.api_endpoint}/api
VITE_AUTH_MODE=demo
EOT
}
