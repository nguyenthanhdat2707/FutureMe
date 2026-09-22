variable "aws_region" {
  type    = string
  default = "ap-southeast-1"
}
variable "expected_account_id" {
  type    = string
  default = "728033416182"
}
variable "project" {
  type    = string
  default = "future-me"
}
variable "environment" {
  type    = string
  default = "prod"
}
variable "allowed_origins" {
  type    = list(string)
  default = ["https://main.d6nuwvgegqhns.amplifyapp.com", "http://localhost:5173", "http://localhost:3000"]
}
variable "bedrock_model_id" {
  type    = string
  default = "anthropic.claude-3-haiku-20240307-v1:0"
}
variable "lambda_memory_mb" {
  type    = number
  default = 512
}
variable "lambda_timeout_seconds" {
  type    = number
  default = 30
}
variable "log_retention_days" {
  type    = number
  default = 14
}
variable "api_throttling_rate_limit" {
  type    = number
  default = 10
}
variable "api_throttling_burst_limit" {
  type    = number
  default = 20
}
variable "artifact_path" {
  type    = string
  default = "lambda.zip"
}
