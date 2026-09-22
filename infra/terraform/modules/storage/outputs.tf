output "table_names" {
  value = {
    users            = aws_dynamodb_table.users.name
    personal_context = aws_dynamodb_table.personal_context.name
    decisions        = aws_dynamodb_table.decisions.name
    observations     = aws_dynamodb_table.observations.name
    calendar_events  = aws_dynamodb_table.calendar_events.name
    outcomes         = aws_dynamodb_table.outcomes.name
    feedback         = aws_dynamodb_table.feedback.name
  }
}

output "table_arns" {
  value = {
    users            = aws_dynamodb_table.users.arn
    personal_context = aws_dynamodb_table.personal_context.arn
    decisions        = aws_dynamodb_table.decisions.arn
    observations     = aws_dynamodb_table.observations.arn
    calendar_events  = aws_dynamodb_table.calendar_events.arn
    outcomes         = aws_dynamodb_table.outcomes.arn
    feedback         = aws_dynamodb_table.feedback.arn
  }
}
