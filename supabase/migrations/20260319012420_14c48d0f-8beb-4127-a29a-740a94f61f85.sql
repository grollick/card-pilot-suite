
-- Estimate Duty Status table
CREATE TABLE IF NOT EXISTS public.estimate_duty_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  is_on_duty boolean NOT NULL DEFAULT false,
  available_until timestamptz DEFAULT NULL,
  service_types text[] DEFAULT '{}',
  service_radius_km integer DEFAULT NULL,
  max_leads integer DEFAULT NULL,
  leads_received integer NOT NULL DEFAULT 0,
  auto_off_after_hours integer DEFAULT NULL,
  auto_off_outside_hours boolean NOT NULL DEFAULT false,
  went_on_duty_at timestamptz DEFAULT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.estimate_duty_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own duty status"
  ON public.estimate_duty_status FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view on-duty status"
  ON public.estimate_duty_status FOR SELECT
  TO anon, authenticated
  USING (is_on_duty = true);

-- Duty analytics log
CREATE TABLE IF NOT EXISTS public.estimate_duty_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lead_id uuid DEFAULT NULL,
  event_type text NOT NULL DEFAULT 'lead_received',
  response_time_minutes integer DEFAULT NULL,
  was_on_duty boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.estimate_duty_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own duty log"
  ON public.estimate_duty_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert duty log"
  ON public.estimate_duty_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Index for fast on-duty lookups
CREATE INDEX IF NOT EXISTS idx_estimate_duty_on_duty ON public.estimate_duty_status (is_on_duty) WHERE is_on_duty = true;
CREATE INDEX IF NOT EXISTS idx_estimate_duty_user ON public.estimate_duty_status (user_id);
CREATE INDEX IF NOT EXISTS idx_estimate_duty_log_user ON public.estimate_duty_log (user_id);
