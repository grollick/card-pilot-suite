CREATE TABLE public.ai_assistant_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  suggestion_type text NOT NULL,
  title text NOT NULL,
  description text,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'active',
  lead_id uuid REFERENCES business_leads(id) ON DELETE SET NULL,
  booking_id uuid REFERENCES business_bookings(id) ON DELETE SET NULL,
  ai_response jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_suggestions_business ON ai_assistant_suggestions(business_id, status);
CREATE INDEX idx_ai_suggestions_user ON ai_assistant_suggestions(user_id, status);

ALTER TABLE ai_assistant_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own suggestions"
  ON ai_assistant_suggestions
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());