
-- 1. Add missing columns to estimate_duty_status
ALTER TABLE public.estimate_duty_status
  ADD COLUMN IF NOT EXISTS duty_type text NOT NULL DEFAULT 'estimates',
  ADD COLUMN IF NOT EXISTS last_response_at timestamptz,
  ADD COLUMN IF NOT EXISTS avg_response_minutes integer,
  ADD COLUMN IF NOT EXISTS missed_leads_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS accepted_leads_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_estimates_count integer NOT NULL DEFAULT 0;

-- 2. Create estimate_requests table (NO cross-ref policy yet)
CREATE TABLE IF NOT EXISTS public.estimate_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_name text NOT NULL,
  requester_email text,
  requester_phone text,
  service_needed text,
  category text,
  request_details text,
  budget text,
  timeline text,
  city text,
  location text,
  source text NOT NULL DEFAULT 'marketplace',
  status text NOT NULL DEFAULT 'pending',
  lead_quality_score integer,
  profession text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.estimate_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can create estimate requests"
  ON public.estimate_requests FOR INSERT TO anon, authenticated
  WITH CHECK (requester_name IS NOT NULL);

-- 3. Create estimate_matches table
CREATE TABLE IF NOT EXISTS public.estimate_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_request_id uuid NOT NULL REFERENCES public.estimate_requests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  match_score integer NOT NULL DEFAULT 0,
  priority_rank integer NOT NULL DEFAULT 1,
  was_notified boolean NOT NULL DEFAULT false,
  notified_at timestamptz,
  response_deadline_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  responded_at timestamptz,
  lead_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.estimate_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own estimate matches"
  ON public.estimate_matches FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own estimate matches"
  ON public.estimate_matches FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert estimate matches"
  ON public.estimate_matches FOR INSERT TO authenticated
  WITH CHECK (true);

-- 4. NOW add cross-ref SELECT policy on estimate_requests
CREATE POLICY "Users view routed estimate requests"
  ON public.estimate_requests FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.estimate_matches em
      WHERE em.estimate_request_id = estimate_requests.id
        AND em.user_id = auth.uid()
    )
  );

-- 5. Create duty_services junction table
CREATE TABLE IF NOT EXISTS public.estimate_duty_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  service_id uuid NOT NULL REFERENCES public.booking_services(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, service_id)
);

ALTER TABLE public.estimate_duty_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own duty services"
  ON public.estimate_duty_services FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view on-duty services"
  ON public.estimate_duty_services FOR SELECT TO anon
  USING (true);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_estimate_requests_status ON public.estimate_requests(status);
CREATE INDEX IF NOT EXISTS idx_estimate_requests_created ON public.estimate_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_estimate_matches_request ON public.estimate_matches(estimate_request_id);
CREATE INDEX IF NOT EXISTS idx_estimate_matches_user ON public.estimate_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_estimate_matches_status ON public.estimate_matches(status);
CREATE INDEX IF NOT EXISTS idx_estimate_duty_services_user ON public.estimate_duty_services(user_id);
CREATE INDEX IF NOT EXISTS idx_duty_status_response ON public.estimate_duty_status(last_response_at);

-- 7. Enable realtime for estimate_matches
ALTER PUBLICATION supabase_realtime ADD TABLE public.estimate_matches;
