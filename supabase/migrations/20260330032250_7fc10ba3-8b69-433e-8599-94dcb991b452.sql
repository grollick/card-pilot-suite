
CREATE TABLE IF NOT EXISTS public.ai_automation_settings (
  business_id uuid PRIMARY KEY REFERENCES public.businesses(id) ON DELETE CASCADE,
  auto_reply_enabled boolean DEFAULT false,
  review_before_send boolean DEFAULT true,
  auto_follow_up_enabled boolean DEFAULT false,
  business_hours_only boolean DEFAULT true,
  high_intent_only boolean DEFAULT false,
  reply_tone text DEFAULT 'professional',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_automation_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners manage automation settings"
  ON public.ai_automation_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = ai_automation_settings.business_id AND b.owner_user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = ai_automation_settings.business_id AND b.owner_user_id = auth.uid())
  );
