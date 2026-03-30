
-- Add scoring_factors column to ai_lead_scores
ALTER TABLE public.ai_lead_scores ADD COLUMN IF NOT EXISTS scoring_factors jsonb DEFAULT '{}';

-- Create copilot_dashboard_summary view
CREATE OR REPLACE VIEW public.copilot_dashboard_summary AS
SELECT
  b.id AS business_id,
  COALESCE(nl.new_lead_count, 0) AS new_leads,
  COALESCE(hi.high_intent_count, 0) AS high_intent_leads,
  COALESCE(pb.pending_booking_count, 0) AS pending_bookings,
  COALESCE(au.ai_usage_this_month, 0) AS ai_usage_this_month,
  COALESCE(ent.monthly_ai_generations, 8) AS monthly_ai_limit,
  COALESCE(sug.active_suggestions, 0) AS active_suggestions
FROM businesses b
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS new_lead_count
  FROM business_leads bl
  WHERE bl.business_id = b.id AND (bl.status IS NULL OR bl.status = 'new')
) nl ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS high_intent_count
  FROM ai_lead_scores als
  WHERE als.business_id = b.id AND als.score >= 80
) hi ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS pending_booking_count
  FROM business_bookings bb
  WHERE bb.business_id = b.id AND bb.status = 'pending'
) pb ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS ai_usage_this_month
  FROM ai_usage_events aue
  WHERE aue.business_id = b.id AND aue.created_at >= date_trunc('month', now())
) au ON true
LEFT JOIN LATERAL (
  SELECT COALESCE(apl.monthly_ai_generations, 8) AS monthly_ai_generations
  FROM business_subscriptions bs
  JOIN subscription_plans sp ON sp.id = bs.plan_id
  LEFT JOIN ai_plan_limits apl ON apl.plan_id = sp.id
  WHERE bs.business_id = b.id AND bs.status = 'active'
  LIMIT 1
) ent ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS active_suggestions
  FROM ai_assistant_suggestions ais
  WHERE ais.business_id = b.id AND ais.status = 'active'
) sug ON true
WHERE b.is_active = true;

ALTER VIEW public.copilot_dashboard_summary SET (security_invoker = true);

-- Create copilot_reply_stats_v2 view over ai_message_events
CREATE OR REPLACE VIEW public.copilot_reply_stats_v2 AS
SELECT
  business_id,
  COUNT(*) AS total_replies,
  COUNT(*) FILTER (WHERE NOT was_auto_sent OR was_auto_sent IS NULL) AS manual_replies,
  COUNT(*) FILTER (WHERE was_auto_sent = true) AS auto_sent_replies,
  COUNT(*) FILTER (WHERE was_user_edited = true) AS edited_replies,
  COUNT(DISTINCT lead_id) AS leads_answered,
  COUNT(*) FILTER (WHERE created_at >= now() - interval '30 days') AS replies_30d,
  COUNT(*) FILTER (WHERE created_at >= now() - interval '7 days') AS replies_7d
FROM ai_message_events
GROUP BY business_id;

ALTER VIEW public.copilot_reply_stats_v2 SET (security_invoker = true);
