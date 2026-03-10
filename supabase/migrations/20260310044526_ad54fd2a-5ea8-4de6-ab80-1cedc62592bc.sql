
-- Neighborhood Boosts table
CREATE TABLE public.neighborhood_boosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid REFERENCES public.organizations(id),
  status text NOT NULL DEFAULT 'active',
  target_city text,
  target_postal_code text,
  radius_km integer NOT NULL DEFAULT 10,
  duration_days integer NOT NULL DEFAULT 7,
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  views_count integer NOT NULL DEFAULT 0,
  leads_count integer NOT NULL DEFAULT 0,
  bookings_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.neighborhood_boosts ENABLE ROW LEVEL SECURITY;

-- Users manage own boosts
CREATE POLICY "Users manage own boosts"
  ON public.neighborhood_boosts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Public can read active boosts (for discover page)
CREATE POLICY "Public can view active boosts"
  ON public.neighborhood_boosts FOR SELECT
  TO anon, authenticated
  USING (status = 'active' AND expires_at > now());

-- Index for fast lookup
CREATE INDEX idx_boosts_active ON public.neighborhood_boosts (status, expires_at) WHERE status = 'active';
CREATE INDEX idx_boosts_user ON public.neighborhood_boosts (user_id);
