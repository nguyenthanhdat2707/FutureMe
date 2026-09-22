output "pool_id" { value = aws_cognito_user_pool.pool.id }
output "pool_arn" { value = aws_cognito_user_pool.pool.arn }
output "client_id" { value = aws_cognito_user_pool_client.client.id }
output "issuer" { value = "https://${aws_cognito_user_pool.pool.endpoint}" }
