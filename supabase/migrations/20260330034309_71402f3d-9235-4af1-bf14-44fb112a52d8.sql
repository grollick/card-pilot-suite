
-- Business Notifications table
CREATE TABLE IF NOT EXISTS public.business_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  urgency text NOT NULL DEFAULT 'medium',
  entity_type text,
  entity_id uuid,
  action_label text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_biz_notif_business ON public.business_notifications(business_id);
CREATE INDEX IF NOT EXISTS idx_biz_notif_read ON public.business_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_biz_notif_created ON public.business_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_biz_notif_type ON public.business_notifications(type);

ALTER TABLE public.business_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_access_notifications"
ON public.business_notifications
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = business_id AND b.owner_user_id = auth.uid()
  )
);

-- SMS Messages table
CREATE TABLE IF NOT EXISTS public.sms_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.business_leads(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.business_bookings(id) ON DELETE SET NULL,
  phone text,
  message_type text NOT NULL,
  message_body text NOT NULL,
  delivery_status text NOT NULL DEFAULT 'draft',
  was_ai_generated boolean NOT NULL DEFAULT true,
  was_user_edited boolean NOT NULL DEFAULT false,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sms_business ON public.sms_messages(business_id);
CREATE INDEX IF NOT EXISTS idx_sms_lead ON public.sms_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_sms_booking ON public.sms_messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_sms_status ON public.sms_messages(delivery_status);
CREATE INDEX IF NOT EXISTS idx_sms_created ON public.sms_messages(created_at DESC);

ALTER TABLE public.sms_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_access_sms"
ON public.sms_messages
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = business_id AND b.owner_user_id = auth.uid()
  )
);

-- Add SMS columns to ai_automation_settings
ALTER TABLE public.ai_automation_settings
  ADD COLUMN IF NOT EXISTS sms_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS sms_review_before_send boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_follow_up_sms_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS booking_reminder_sms_enabled boolean DEFAULT false;

-- Trigger: create notification on new business lead
CREATE OR REPLACE FUNCTION public.notify_new_business_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO business_notifications (business_id, type, title, body, urgency, entity_type, entity_id, action_label)
  VALUES (
    NEW.business_id,
    'new_lead',
    'New lead received',
    'You received a new lead from ' || NEW.full_name,
    'high',
    'lead',
    NEW.id,
    'Reply Now'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_business_lead ON public.business_leads;
CREATE TRIGGER trg_notify_new_business_lead
  AFTER INSERT ON public.business_leads
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_business_lead();

-- Trigger: notify on high-intent lead score
CREATE OR REPLACE FUNCTION public.notify_high_intent_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.score >= 80 THEN
    INSERT INTO business_notifications (business_id, type, title, body, urgency, entity_type, entity_id, action_label)
    VALUES (
      NEW.business_id,
      'high_intent_lead',
      'High-intent lead needs a reply',
      NEW.label || ' lead scored ' || NEW.score || ' — respond quickly!',
      'high',
      'lead',
      NEW.lead_id,
      'Reply Now'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_high_intent ON public.ai_lead_scores;
CREATE TRIGGER trg_notify_high_intent
  AFTER INSERT OR UPDATE ON public.ai_lead_scores
  FOR EACH ROW EXECUTE FUNCTION public.notify_high_intent_lead();

-- Trigger: notify on pending booking
CREATE OR REPLACE FUNCTION public.notify_pending_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    INSERT INTO business_notifications (business_id, type, title, body, urgency, entity_type, entity_id, action_label)
    VALUES (
      NEW.business_id,
      'booking_pending',
      'Booking needs confirmation',
      NEW.customer_name || ' booked — confirm the appointment',
      'high',
      'booking',
      NEW.id,
      'Confirm Booking'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_pending_booking ON public.business_bookings;
CREATE TRIGGER trg_notify_pending_booking
  AFTER INSERT ON public.business_bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_pending_booking();

-- Trigger: notify on completed booking (review opportunity)
CREATE OR REPLACE FUNCTION public.notify_completed_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    INSERT INTO business_notifications (business_id, type, title, body, urgency, entity_type, entity_id, action_label)
    VALUES (
      NEW.business_id,
      'review_request',
      'Ask for a review',
      'Great job with ' || NEW.customer_name || ' — ask for a review!',
      'low',
      'booking',
      NEW.id,
      'Request Review'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_completed_booking ON public.business_bookings;
CREATE TRIGGER trg_notify_completed_booking
  AFTER UPDATE ON public.business_bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_completed_booking();
