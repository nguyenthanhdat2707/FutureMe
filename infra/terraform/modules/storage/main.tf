resource "aws_dynamodb_table" "users" {
  name         = "${var.project}-${var.environment}-users"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
  attribute {
    name = "id"
    type = "S"
  }
  attribute {
    name = "email"
    type = "S"
  }
  attribute {
    name = "google_id"
    type = "S"
  }

  global_secondary_index {
    name            = "email-index"
    projection_type = "ALL"
    key_schema {
      attribute_name = "email"
      key_type       = "HASH"
    }
  }
  global_secondary_index {
    name            = "googleId-index"
    projection_type = "ALL"
    key_schema {
      attribute_name = "google_id"
      key_type       = "HASH"
    }
  }
}

resource "aws_dynamodb_table" "personal_context" {
  name         = "${var.project}-${var.environment}-personal-context"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
  attribute {
    name = "id"
    type = "S"
  }
  attribute {
    name = "user_id"
    type = "S"
  }
  attribute {
    name = "observed_at"
    type = "S"
  }
  attribute {
    name = "attribute"
    type = "S"
  }

  global_secondary_index {
    name            = "userId-observedAt-index"
    projection_type = "ALL"
    key_schema {
      attribute_name = "user_id"
      key_type       = "HASH"
    }
    key_schema {
      attribute_name = "observed_at"
      key_type       = "RANGE"
    }
  }
  global_secondary_index {
    name            = "userId-attribute-index"
    projection_type = "ALL"
    key_schema {
      attribute_name = "user_id"
      key_type       = "HASH"
    }
    key_schema {
      attribute_name = "attribute"
      key_type       = "RANGE"
    }
  }
}

resource "aws_dynamodb_table" "decisions" {
  name         = "${var.project}-${var.environment}-decisions"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
  attribute {
    name = "id"
    type = "S"
  }
  attribute {
    name = "user_id"
    type = "S"
  }
  attribute {
    name = "created_at"
    type = "S"
  }

  global_secondary_index {
    name            = "userId-createdAt-index"
    projection_type = "ALL"
    key_schema {
      attribute_name = "user_id"
      key_type       = "HASH"
    }
    key_schema {
      attribute_name = "created_at"
      key_type       = "RANGE"
    }
  }
}

resource "aws_dynamodb_table" "observations" {
  name         = "${var.project}-${var.environment}-observations"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
  attribute {
    name = "id"
    type = "S"
  }
  attribute {
    name = "user_id"
    type = "S"
  }
  attribute {
    name = "timestamp"
    type = "S"
  }

  global_secondary_index {
    name            = "userId-timestamp-index"
    projection_type = "ALL"
    key_schema {
      attribute_name = "user_id"
      key_type       = "HASH"
    }
    key_schema {
      attribute_name = "timestamp"
      key_type       = "RANGE"
    }
  }
}

resource "aws_dynamodb_table" "calendar_events" {
  name         = "${var.project}-${var.environment}-calendar-events"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
  attribute {
    name = "id"
    type = "S"
  }
  attribute {
    name = "user_id"
    type = "S"
  }
  attribute {
    name = "start_time"
    type = "S"
  }
  attribute {
    name = "external_id"
    type = "S"
  }

  global_secondary_index {
    name            = "userId-startTime-index"
    projection_type = "ALL"
    key_schema {
      attribute_name = "user_id"
      key_type       = "HASH"
    }
    key_schema {
      attribute_name = "start_time"
      key_type       = "RANGE"
    }
  }
  global_secondary_index {
    name            = "userId-externalId-index"
    projection_type = "ALL"
    key_schema {
      attribute_name = "user_id"
      key_type       = "HASH"
    }
    key_schema {
      attribute_name = "external_id"
      key_type       = "RANGE"
    }
  }
}

resource "aws_dynamodb_table" "outcomes" {
  name         = "${var.project}-${var.environment}-outcomes"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
  attribute {
    name = "id"
    type = "S"
  }
  attribute {
    name = "decision_id"
    type = "S"
  }
  attribute {
    name = "user_id"
    type = "S"
  }
  attribute {
    name = "observed_at"
    type = "S"
  }

  global_secondary_index {
    name            = "decisionId-observedAt-index"
    projection_type = "ALL"
    key_schema {
      attribute_name = "decision_id"
      key_type       = "HASH"
    }
    key_schema {
      attribute_name = "observed_at"
      key_type       = "RANGE"
    }
  }
  global_secondary_index {
    name            = "userId-observedAt-index"
    projection_type = "ALL"
    key_schema {
      attribute_name = "user_id"
      key_type       = "HASH"
    }
    key_schema {
      attribute_name = "observed_at"
      key_type       = "RANGE"
    }
  }
}

resource "aws_dynamodb_table" "feedback" {
  name         = "${var.project}-${var.environment}-feedback"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
  attribute {
    name = "id"
    type = "S"
  }
  attribute {
    name = "target_id"
    type = "S"
  }
  attribute {
    name = "user_id"
    type = "S"
  }
  attribute {
    name = "created_at"
    type = "S"
  }

  global_secondary_index {
    name            = "targetId-createdAt-index"
    projection_type = "ALL"
    key_schema {
      attribute_name = "target_id"
      key_type       = "HASH"
    }
    key_schema {
      attribute_name = "created_at"
      key_type       = "RANGE"
    }
  }
  global_secondary_index {
    name            = "userId-createdAt-index"
    projection_type = "ALL"
    key_schema {
      attribute_name = "user_id"
      key_type       = "HASH"
    }
    key_schema {
      attribute_name = "created_at"
      key_type       = "RANGE"
    }
  }
}
