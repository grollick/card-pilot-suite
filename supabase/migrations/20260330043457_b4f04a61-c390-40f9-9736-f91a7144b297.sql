
-- PHASE 1: Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- PHASE 2: Add missing columns to sms_message_events
ALTER TABLE public.sms_message_events ADD COLUMN IF NOT EXISTS twilio_message_sid text;
ALTER TABLE public.sms_message_events ADD COLUMN IF NOT EXISTS error_code text;
ALTER TABLE public.sms_message_events ADD COLUMN IF NOT EXISTS error_message text;
ALTER TABLE public.sms_message_events ADD COLUMN IF NOT EXISTS delivered_at timestamptz;
ALTER TABLE public.sms_message_events ADD COLUMN IF NOT EXISTS failed_at timestamptz;
ALTER TABLE public.sms_message_events ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- PHASE 3: Indexes
CREATE INDEX IF NOT EXISTS idx_sms_events_business ON public.sms_message_events (business_id);
CREATE INDEX IF NOT EXISTS idx_sms_events_lead ON public.sms_message_events (lead_id);
CREATE INDEX IF NOT EXISTS idx_sms_events_booking ON public.sms_message_events (booking_id);
CREATE INDEX IF NOT EXISTS idx_sms_events_status ON public.sms_message_events (delivery_status);
CREATE INDEX IF NOT EXISTS idx_sms_events_twilio_sid ON public.sms_message_events (twilio_message_sid);
CREATE INDEX IF NOT EXISTS idx_sms_events_created ON public.sms_message_events (created_at);

-- PHASE 4: updated_at trigger
CREATE OR REPLACE FUNCTION public.set_sms_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sms_updated_at ON public.sms_message_events;
CREATE TRIGGER trg_sms_updated_at
  BEFORE UPDATE ON public.sms_message_events
  FOR EACH ROW EXECUTE FUNCTION public.set_sms_updated_at();

-- PHASE 5: SMS context view
CREATE OR REPLACE VIEW public.sms_message_context
WITH (security_invoker = on) AS
SELECT
  s.id,
  s.business_id,
  b.business_name,
  s.lead_id,
  s.booking_id,
  COALESCE(bl.full_name, bb.customer_name) AS customer_name,
  s.phone,
  s.message_type,
  s.message_body,
  s.delivery_status,
  s.twilio_message_sid,
  s.was_ai_generated,
  s.was_user_edited,
  s.sent_at,
  s.delivered_at,
  s.failed_at,
  s.error_code,
  s.error_message,
  s.created_at
FROM public.sms_message_events s
JOIN public.businesses b ON b.id = s.business_id
LEFT JOIN public.business_leads bl ON bl.id = s.lead_id
LEFT JOIN public.business_bookings bb ON bb.id = s.booking_id;

-- PHASE 6 + 7: Normalize status + webhook update function
CREATE OR REPLACE FUNCTION public.normalize_twilio_status(p_status text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = 'public'
AS $$
  SELECT CASE lower(p_status)
    WHEN 'accepted' THEN 'queued'
    WHEN 'queued' THEN 'queued'
    WHEN 'sending' THEN 'sent'
    WHEN 'sent' THEN 'sent'
    WHEN 'delivered' THEN 'delivered'
    WHEN 'undelivered' THEN 'failed'
    WHEN 'failed' THEN 'failed'
    ELSE lower(p_status)
  END;
$$;

CREATE OR REPLACE FUNCTION public.update_sms_delivery_status(
  p_twilio_message_sid text,
  p_delivery_status text,
  p_error_code text DEFAULT NULL,
  p_error_message text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_status text;
BEGIN
  v_status := public.normalize_twilio_status(p_delivery_status);

  UPDATE public.sms_message_events
  SET
    delivery_status = v_status,
    sent_at = CASE WHEN v_status = 'sent' AND sent_at IS NULL THEN now() ELSE sent_at END,
    delivered_at = CASE WHEN v_status = 'delivered' THEN now() ELSE delivered_at END,
    failed_at = CASE WHEN v_status = 'failed' THEN now() ELSE failed_at END,
    error_code = CASE WHEN v_status = 'failed' THEN COALESCE(p_error_code, error_code) ELSE error_code END,
    error_message = CASE WHEN v_status = 'failed' THEN COALESCE(p_error_message, error_message) ELSE error_message END
  WHERE twilio_message_sid = p_twilio_message_sid;
END;
$$;

-- PHASE 9 + 10: SMS notification bridge
CREATE OR REPLACE FUNCTION public.process_sms_webhook(
  p_twilio_message_sid text,
  p_delivery_status text,
  p_error_code text DEFAULT NULL,
  p_error_message text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_status text;
  v_biz_id uuid;
  v_sms_id uuid;
  v_old_status text;
BEGIN
  v_status := public.normalize_twilio_status(p_delivery_status);

  SELECT id, business_id, delivery_status
  INTO v_sms_id, v_biz_id, v_old_status
  FROM public.sms_message_events
  WHERE twilio_message_sid = p_twilio_message_sid
  LIMIT 1;

  IF v_sms_id IS NULL THEN RETURN; END IF;
  IF v_old_status = v_status THEN RETURN; END IF;

  PERFORM public.update_sms_delivery_status(p_twilio_message_sid, p_delivery_status, p_error_code, p_error_message);

  IF v_status = 'delivered' THEN
    PERFORM public.create_notification(v_biz_id, 'sms_delivered', 'Text message delivered', 'Your message was delivered successfully', 'sms', v_sms_id, 'low');
  ELSIF v_status = 'failed' THEN
    PERFORM public.create_notification(v_biz_id, 'sms_failed', 'SMS delivery failed', COALESCE(p_error_message, 'Message could not be delivered'), 'sms', v_sms_id, 'high');
  END IF;
END;
$$;

-- PHASE 11: RLS
ALTER TABLE public.sms_message_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sms_message_events' AND policyname = 'sms_owner_select') THEN
    CREATE POLICY sms_owner_select ON public.sms_message_events FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sms_message_events' AND policyname = 'sms_owner_insert') THEN
    CREATE POLICY sms_owner_insert ON public.sms_message_events FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sms_message_events' AND policyname = 'sms_owner_update') THEN
    CREATE POLICY sms_owner_update ON public.sms_message_events FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_user_id = auth.uid()));
  END IF;
END $$;

-- PHASE 12: Delivery summary view
CREATE OR REPLACE VIEW public.sms_delivery_summary
WITH (security_invoker = on) AS
SELECT
  business_id,
  COUNT(*) AS total_messages,
  COUNT(*) FILTER (WHERE delivery_status = 'sent') AS total_sent,
  COUNT(*) FILTER (WHERE delivery_status = 'delivered') AS total_delivered,
  COUNT(*) FILTER (WHERE delivery_status = 'failed') AS total_failed,
  ROUND(
    COUNT(*) FILTER (WHERE delivery_status = 'delivered')::numeric /
    NULLIF(COUNT(*) FILTER (WHERE delivery_status IN ('sent','delivered','failed')), 0) * 100,
    1
  ) AS delivery_rate
FROM public.sms_message_events
WHERE delivery_status NOT IN ('draft')
GROUP BY business_id;
