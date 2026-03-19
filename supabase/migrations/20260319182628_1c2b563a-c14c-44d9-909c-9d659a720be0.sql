
-- Landing page content storage for admin editing
CREATE TABLE public.landing_page_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key text NOT NULL UNIQUE,
  page_title text NOT NULL DEFAULT '',
  page_description text DEFAULT '',
  sections_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  settings_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_published boolean NOT NULL DEFAULT true,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.landing_page_content ENABLE ROW LEVEL SECURITY;

-- Admins can manage all content
CREATE POLICY "Admins manage landing page content"
  ON public.landing_page_content
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Public can read published content
CREATE POLICY "Public can read published landing pages"
  ON public.landing_page_content
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);
