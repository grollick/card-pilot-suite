
-- Projects table (before/after portfolio cards)
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid REFERENCES public.organizations(id),
  title text NOT NULL,
  description text,
  before_image_url text,
  after_image_url text,
  services_used text[] DEFAULT '{}'::text[],
  location text,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view public projects" ON public.projects
  FOR SELECT TO anon, authenticated USING (is_public = true);

CREATE POLICY "Users manage own projects" ON public.projects
  FOR ALL TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_projects_user_id ON public.projects(user_id);

-- Reviews table
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  reviewer_name text NOT NULL,
  reviewer_email text,
  rating integer NOT NULL DEFAULT 5,
  review_text text,
  is_public boolean NOT NULL DEFAULT true,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view public reviews" ON public.reviews
  FOR SELECT TO anon, authenticated USING (is_public = true);

CREATE POLICY "Public can insert reviews" ON public.reviews
  FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NOT NULL AND reviewer_name IS NOT NULL);

CREATE POLICY "Users manage own reviews" ON public.reviews
  FOR ALL TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_reviews_user_id ON public.reviews(user_id);

-- Updated_at triggers
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
