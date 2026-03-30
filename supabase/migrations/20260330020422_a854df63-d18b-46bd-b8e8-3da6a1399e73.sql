CREATE TABLE IF NOT EXISTS public.plan_limits (
  plan_id uuid PRIMARY KEY REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  max_services integer,
  max_bookings_per_month integer,
  max_service_areas integer,
  branding_removed boolean DEFAULT false,
  featured_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read plan limits"
  ON public.plan_limits
  FOR SELECT
  USING (true);