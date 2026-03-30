
-- Auto-reply log table
CREATE TABLE IF NOT EXISTS public.copilot_reply_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.business_leads(id) ON DELETE SET NULL,
  booking_id uuid REFERENCES public.business_bookings(id) ON DELETE SET NULL,
  message_type text NOT NULL DEFAULT 'initial_reply',
  generated_content text NOT NULL,
  was_auto_sent boolean NOT NULL DEFAULT false,
  was_user_edited boolean NOT NULL DEFAULT false,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_copilot_reply_log_business ON public.copilot_reply_log(business_id);
CREATE INDEX idx_copilot_reply_log_lead ON public.copilot_reply_log(lead_id);
CREATE INDEX idx_copilot_reply_log_type ON public.copilot_reply_log(message_type);
CREATE INDEX idx_copilot_reply_log_created ON public.copilot_reply_log(created_at);

ALTER TABLE public.copilot_reply_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners manage their reply logs"
  ON public.copilot_reply_log
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = copilot_reply_log.business_id AND b.owner_user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = copilot_reply_log.business_id AND b.owner_user_id = auth.uid())
  );

-- Auto-reply settings table
CREATE TABLE IF NOT EXISTS public.copilot_auto_reply_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE UNIQUE,
  auto_reply_enabled boolean NOT NULL DEFAULT false,
  auto_follow_up_enabled boolean NOT NULL DEFAULT false,
  review_before_send boolean NOT NULL DEFAULT true,
  reply_tone text NOT NULL DEFAULT 'professional',
  auto_reply_scope text NOT NULL DEFAULT 'marketplace',
  business_hours_only boolean NOT NULL DEFAULT true,
  business_hours_start time NOT NULL DEFAULT '08:00',
  business_hours_end time NOT NULL DEFAULT '18:00',
  min_lead_score integer DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.copilot_auto_reply_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners manage auto-reply settings"
  ON public.copilot_auto_reply_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = copilot_auto_reply_settings.business_id AND b.owner_user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = copilot_auto_reply_settings.business_id AND b.owner_user_id = auth.uid())
  );

-- Reply stats view
CREATE OR REPLACE VIEW public.copilot_reply_stats AS
SELECT
  crl.business_id,
  COUNT(*) AS total_replies,
  COUNT(*) FILTER (WHERE crl.sent_at IS NOT NULL) AS sent_replies,
  COUNT(*) FILTER (WHERE crl.was_auto_sent = true) AS auto_sent_replies,
  COUNT(*) FILTER (WHERE crl.was_user_edited = true) AS edited_replies,
  COUNT(DISTINCT crl.lead_id) AS leads_answered,
  COUNT(*) FILTER (WHERE crl.created_at >= now() - interval '30 days') AS replies_30d,
  COUNT(*) FILTER (WHERE crl.created_at >= now() - interval '7 days') AS replies_7d
FROM public.copilot_reply_log crl
GROUP BY crl.business_id;

ALTER VIEW public.copilot_reply_stats SET (security_invoker = on);
