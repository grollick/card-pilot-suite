CREATE INDEX IF NOT EXISTS idx_ai_suggestions_business_id
  ON ai_assistant_suggestions(business_id);

CREATE INDEX IF NOT EXISTS idx_ai_suggestions_status
  ON ai_assistant_suggestions(status);