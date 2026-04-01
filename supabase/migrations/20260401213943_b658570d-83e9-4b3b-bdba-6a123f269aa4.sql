CREATE TABLE IF NOT EXISTS public.estimate_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  default_job_type text NOT NULL DEFAULT '',
  sections_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.estimate_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own templates" ON public.estimate_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own templates" ON public.estimate_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON public.estimate_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON public.estimate_templates
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_estimate_templates_user ON public.estimate_templates(user_id);

CREATE TRIGGER update_estimate_templates_updated_at
  BEFORE UPDATE ON public.estimate_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();