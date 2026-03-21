
CREATE TABLE public.success_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name text NOT NULL,
  business_type text NOT NULL,
  result_text text NOT NULL,
  timeframe text NOT NULL DEFAULT '',
  quote text DEFAULT '',
  metric_value text DEFAULT '',
  metric_label text DEFAULT '',
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true,
  display_locations text[] DEFAULT '{landing,dashboard,onboarding}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active success stories"
  ON public.success_stories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage success stories"
  ON public.success_stories FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'founder'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'founder'));
