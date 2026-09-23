data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda_exec" {
  name               = "${var.project}-${var.environment}-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

data "aws_iam_policy_document" "lambda_policy" {
  statement {
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["${aws_cloudwatch_log_group.lambda_logs.arn}:*"]
  }

  statement {
    actions = [
      "dynamodb:PutItem",
      "dynamodb:GetItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query"
    ]
    resources = flatten([
      for arn in values(var.table_arns) : [arn, "${arn}/index/*"]
    ])
  }

  statement {
    actions   = ["bedrock:InvokeModel"]
    resources = ["arn:aws:bedrock:${var.aws_region}::foundation-model/${var.bedrock_model_id}"]
  }
}

resource "aws_iam_role_policy" "lambda_policy" {
  name   = "${var.project}-${var.environment}-lambda-policy"
  role   = aws_iam_role.lambda_exec.id
  policy = data.aws_iam_policy_document.lambda_policy.json
}

resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${var.project}-${var.environment}-api"
  retention_in_days = var.log_retention_days
}

resource "aws_lambda_function" "api" {
  function_name    = "${var.project}-${var.environment}-api"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "dist/lambda.handler"
  runtime          = "nodejs24.x"
  filename         = var.artifact_path
  source_code_hash = filebase64sha256(var.artifact_path)
  memory_size      = var.lambda_memory_mb
  timeout          = var.lambda_timeout_seconds

  environment {
    variables = {
      NODE_ENV             = "production"
      PERSISTENCE_PROVIDER = "dynamodb"
      LLM_PROVIDER         = "bedrock"
      BEDROCK_MODEL_ID     = var.bedrock_model_id
      USERS_TABLE          = var.table_names["users"]
      CONTEXT_TABLE        = var.table_names["personal_context"]
      DECISIONS_TABLE      = var.table_names["decisions"]
      OBS_TABLE            = var.table_names["observations"]
      CALENDAR_TABLE       = var.table_names["calendar_events"]
      OUTCOMES_TABLE       = var.table_names["outcomes"]
      FEEDBACK_TABLE       = var.table_names["feedback"]
      AUTH_MODE            = "demo"
    }
  }

  depends_on = [aws_cloudwatch_log_group.lambda_logs]
}
