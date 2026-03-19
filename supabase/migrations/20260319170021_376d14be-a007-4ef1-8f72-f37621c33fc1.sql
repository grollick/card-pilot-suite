
-- Feedback type enum
CREATE TYPE public.feedback_type AS ENUM ('bug', 'suggestion', 'confusing', 'positive');

-- Feedback status enum
CREATE TYPE public.feedback_status AS ENUM ('new', 'in_review', 'planned', 'fixed');

-- Beta feedback table
CREATE TABLE public.beta_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_type public.feedback_type NOT NULL DEFAULT 'suggestion',
  message text NOT NULL,
  screenshot_url text,
  page_url text,
  feature_tag text,
  device_type text,
  status public.feedback_status NOT NULL DEFAULT 'new',
  admin_notes text,
  meta_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_beta_feedback_user ON public.beta_feedback (user_id);
CREATE INDEX idx_beta_feedback_status ON public.beta_feedback (status);
CREATE INDEX idx_beta_feedback_type ON public.beta_feedback (feedback_type);
CREATE INDEX idx_beta_feedback_created ON public.beta_feedback (created_at DESC);

-- RLS
ALTER TABLE public.beta_feedback ENABLE ROW LEVEL SECURITY;

-- Users can insert their own feedback
CREATE POLICY "Users insert own feedback"
  ON public.beta_feedback FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own feedback
CREATE POLICY "Users view own feedback"
  ON public.beta_feedback FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Admins full access
CREATE POLICY "Admins full access on beta_feedback"
  ON public.beta_feedback FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE TRIGGER update_beta_feedback_updated_at
  BEFORE UPDATE ON public.beta_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
