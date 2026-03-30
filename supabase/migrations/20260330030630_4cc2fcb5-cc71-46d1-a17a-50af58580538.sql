-- AI Usage Events table
CREATE TABLE public.ai_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id uuid,
  feature_key text NOT NULL,
  entity_type text,
  entity_id uuid,
  credits_used integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_usage_events_business ON ai_usage_events(business_id);
CREATE INDEX idx_ai_usage_events_feature ON ai_usage_events(feature_key);
CREATE INDEX idx_ai_usage_events_created ON ai_usage_events(created_at);

ALTER TABLE ai_usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own usage events"
  ON ai_usage_events FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Monthly usage view
CREATE OR REPLACE VIEW public.ai_usage_monthly AS
SELECT
  business_id,
  date_trunc('month', created_at)::date AS month,
  COUNT(*)::integer AS total_generations,
  COALESCE(SUM(credits_used), 0)::integer AS total_credits
FROM ai_usage_events
GROUP BY business_id, date_trunc('month', created_at);

ALTER VIEW public.ai_usage_monthly SET (security_invoker = true);

-- AI Plan Limits table
CREATE TABLE public.ai_plan_limits (
  plan_id uuid PRIMARY KEY REFERENCES subscription_plans(id),
  monthly_ai_generations integer NOT NULL DEFAULT 8,
  follow_up_enabled boolean NOT NULL DEFAULT false,
  profile_rewrite_enabled boolean NOT NULL DEFAULT false,
  advanced_growth_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ai_plan_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read plan limits"
  ON ai_plan_limits FOR SELECT TO authenticated
  USING (true);

-- Business AI Entitlements view
CREATE OR REPLACE VIEW public.business_ai_entitlements AS
SELECT
  b.id AS business_id,
  sp.name AS plan_name,
  COALESCE(apl.monthly_ai_generations, 8) AS monthly_ai_generations,
  COALESCE(apl.follow_up_enabled, false) AS follow_up_enabled,
  COALESCE(apl.profile_rewrite_enabled, false) AS profile_rewrite_enabled,
  COALESCE(apl.advanced_growth_enabled, false) AS advanced_growth_enabled
FROM businesses b
JOIN business_subscriptions bs ON bs.business_id = b.id AND bs.status = 'active'
JOIN subscription_plans sp ON sp.id = bs.plan_id
LEFT JOIN ai_plan_limits apl ON apl.plan_id = sp.id;

ALTER VIEW public.business_ai_entitlements SET (security_invoker = true);