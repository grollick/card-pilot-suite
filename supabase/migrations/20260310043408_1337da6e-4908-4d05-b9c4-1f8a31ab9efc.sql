
-- Autopilot settings per user
CREATE TABLE public.autopilot_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  approval_mode text NOT NULL DEFAULT 'automatic',
  lead_followup boolean NOT NULL DEFAULT true,
  estimate_reminders boolean NOT NULL DEFAULT true,
  review_requests boolean NOT NULL DEFAULT true,
  social_posts boolean NOT NULL DEFAULT false,
  promotions boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.autopilot_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own autopilot settings"
  ON public.autopilot_settings FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Autopilot activity log
CREATE TABLE public.autopilot_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'completed',
  meta_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.autopilot_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own autopilot log"
  ON public.autopilot_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert autopilot log"
  ON public.autopilot_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_autopilot_log_user_created ON public.autopilot_log(user_id, created_at DESC);

-- Updated_at trigger for settings
CREATE TRIGGER update_autopilot_settings_updated_at
  BEFORE UPDATE ON public.autopilot_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
