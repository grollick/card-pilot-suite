
CREATE TABLE IF NOT EXISTS public.ai_message_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.business_leads(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.business_bookings(id) ON DELETE SET NULL,
  message_type text NOT NULL,
  generated_content text NOT NULL,
  was_auto_sent boolean DEFAULT false,
  was_user_edited boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_message_events_business ON public.ai_message_events(business_id);
CREATE INDEX IF NOT EXISTS idx_ai_message_events_lead ON public.ai_message_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_ai_message_events_type ON public.ai_message_events(message_type);

ALTER TABLE public.ai_message_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners manage message events"
  ON public.ai_message_events
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = ai_message_events.business_id AND b.owner_user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = ai_message_events.business_id AND b.owner_user_id = auth.uid())
  );
