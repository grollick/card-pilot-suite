
-- AI ROI metrics view: connects AI usage events to lead/booking outcomes
CREATE OR REPLACE VIEW public.ai_roi_metrics AS
WITH ai_lead_events AS (
  -- Leads that received AI assistance
  SELECT DISTINCT
    aue.business_id,
    aue.entity_id AS lead_id,
    aue.created_at AS ai_used_at
  FROM ai_usage_events aue
  WHERE aue.entity_type = 'lead'
    AND aue.entity_id IS NOT NULL
),
ai_assisted_bookings AS (
  -- Bookings linked to AI-assisted leads
  SELECT
    bb.business_id,
    bb.id AS booking_id,
    bb.lead_id,
    ale.ai_used_at
  FROM business_bookings bb
  INNER JOIN ai_lead_events ale
    ON ale.business_id = bb.business_id
    AND ale.lead_id = bb.lead_id
  WHERE bb.lead_id IS NOT NULL
),
monthly_stats AS (
  SELECT
    b.id AS business_id,
    b.business_name,
    -- Total AI generations this month
    COALESCE((
      SELECT COUNT(*)
      FROM ai_usage_events aue
      WHERE aue.business_id = b.id
        AND aue.created_at >= date_trunc('month', now())
    ), 0) AS total_ai_generations_month,
    -- Total AI generations all time
    COALESCE((
      SELECT COUNT(*)
      FROM ai_usage_events aue
      WHERE aue.business_id = b.id
    ), 0) AS total_ai_generations,
    -- AI-assisted leads (all time)
    COALESCE((
      SELECT COUNT(DISTINCT lead_id)
      FROM ai_lead_events ale
      WHERE ale.business_id = b.id
    ), 0) AS ai_assisted_leads,
    -- AI-assisted leads this month
    COALESCE((
      SELECT COUNT(DISTINCT lead_id)
      FROM ai_lead_events ale
      WHERE ale.business_id = b.id
        AND ale.ai_used_at >= date_trunc('month', now())
    ), 0) AS ai_assisted_leads_month,
    -- AI-assisted bookings (all time)
    COALESCE((
      SELECT COUNT(DISTINCT booking_id)
      FROM ai_assisted_bookings aab
      WHERE aab.business_id = b.id
    ), 0) AS ai_assisted_bookings,
    -- AI-assisted bookings this month
    COALESCE((
      SELECT COUNT(DISTINCT booking_id)
      FROM ai_assisted_bookings aab
      WHERE aab.business_id = b.id
        AND aab.ai_used_at >= date_trunc('month', now())
    ), 0) AS ai_assisted_bookings_month,
    -- Previous month AI-assisted leads
    COALESCE((
      SELECT COUNT(DISTINCT lead_id)
      FROM ai_lead_events ale
      WHERE ale.business_id = b.id
        AND ale.ai_used_at >= date_trunc('month', now() - interval '1 month')
        AND ale.ai_used_at < date_trunc('month', now())
    ), 0) AS ai_assisted_leads_prev_month,
    -- Previous month AI-assisted bookings
    COALESCE((
      SELECT COUNT(DISTINCT booking_id)
      FROM ai_assisted_bookings aab
      WHERE aab.business_id = b.id
        AND aab.ai_used_at >= date_trunc('month', now() - interval '1 month')
        AND aab.ai_used_at < date_trunc('month', now())
    ), 0) AS ai_assisted_bookings_prev_month
  FROM businesses b
  WHERE b.is_active = true
)
SELECT
  ms.*,
  CASE
    WHEN ms.ai_assisted_leads > 0
    THEN ROUND((ms.ai_assisted_bookings::numeric / ms.ai_assisted_leads) * 100, 1)
    ELSE 0
  END AS conversion_rate,
  CASE
    WHEN ms.ai_assisted_leads_month > 0
    THEN ROUND((ms.ai_assisted_bookings_month::numeric / ms.ai_assisted_leads_month) * 100, 1)
    ELSE 0
  END AS conversion_rate_month
FROM monthly_stats ms;
