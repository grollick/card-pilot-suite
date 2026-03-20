
-- A/B Tests
CREATE TABLE public.ab_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  page text NOT NULL DEFAULT 'landing',
  section text NOT NULL DEFAULT 'hero',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  winner_variant_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- A/B Test Variants
CREATE TABLE public.ab_test_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid REFERENCES public.ab_tests(id) ON DELETE CASCADE NOT NULL,
  variant_key text NOT NULL,
  headline text,
  subheadline text,
  cta_text text,
  hero_visual_url text,
  weight integer NOT NULL DEFAULT 50,
  views integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  signups integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(test_id, variant_key)
);

-- A/B Test Events (granular tracking)
CREATE TABLE public.ab_test_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid REFERENCES public.ab_tests(id) ON DELETE CASCADE NOT NULL,
  variant_id uuid REFERENCES public.ab_test_variants(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('view', 'click', 'signup')),
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_ab_test_events_variant ON public.ab_test_events(variant_id);
CREATE INDEX idx_ab_test_events_test ON public.ab_test_events(test_id);
CREATE INDEX idx_ab_test_variants_test ON public.ab_test_variants(test_id);

-- RLS
ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_test_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_test_events ENABLE ROW LEVEL SECURITY;

-- Public read for active tests (visitors need to see variants)
CREATE POLICY "Anyone can read active tests" ON public.ab_tests FOR SELECT USING (status = 'active');
CREATE POLICY "Anyone can read variants" ON public.ab_test_variants FOR SELECT USING (true);

-- Anyone can insert events (anonymous tracking)
CREATE POLICY "Anyone can insert events" ON public.ab_test_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read events" ON public.ab_test_events FOR SELECT USING (true);

-- Admins can manage tests
CREATE POLICY "Admins manage tests" ON public.ab_tests FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage variants" ON public.ab_test_variants FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Function to increment variant counters atomically
CREATE OR REPLACE FUNCTION public.increment_ab_variant_counter(p_variant_id uuid, p_counter text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF p_counter = 'views' THEN
    UPDATE ab_test_variants SET views = views + 1 WHERE id = p_variant_id;
  ELSIF p_counter = 'clicks' THEN
    UPDATE ab_test_variants SET clicks = clicks + 1 WHERE id = p_variant_id;
  ELSIF p_counter = 'signups' THEN
    UPDATE ab_test_variants SET signups = signups + 1 WHERE id = p_variant_id;
  END IF;
END;
$$;
