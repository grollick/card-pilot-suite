
CREATE TABLE public.auto_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  name text NOT NULL,
  campaign_type text NOT NULL DEFAULT 'general',
  profession text,
  frequency text NOT NULL DEFAULT 'weekly',
  posts_per_week integer NOT NULL DEFAULT 3,
  status text NOT NULL DEFAULT 'draft',
  content_types text[] NOT NULL DEFAULT ARRAY['project_completed', 'promotion', 'tip'],
  settings_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  next_post_at timestamptz,
  posts_generated integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.auto_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own campaigns"
  ON public.auto_campaigns FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_auto_campaigns_updated_at
  BEFORE UPDATE ON public.auto_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_auto_campaigns_user_id ON public.auto_campaigns(user_id);
CREATE INDEX idx_auto_campaigns_status ON public.auto_campaigns(status);
