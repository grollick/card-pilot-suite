-- Add missing created_at index on ai_message_events for time-range queries
CREATE INDEX IF NOT EXISTS idx_ai_message_events_created ON ai_message_events(created_at);

-- Add missing entity index on ai_suggestions for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_entity ON ai_assistant_suggestions(suggestion_type, status);