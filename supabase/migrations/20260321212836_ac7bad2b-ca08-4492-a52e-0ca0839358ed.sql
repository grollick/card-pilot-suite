
-- User interviews table
CREATE TABLE public.user_interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  interviewer_name text NOT NULL DEFAULT '',
  interview_date timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','in_progress','completed','cancelled')),
  candidate_reason text,
  candidate_group text CHECK (candidate_group IN ('newly_activated','dropped_off','highly_engaged','beta_tester','first_lead','not_activated')),
  follow_up_status text CHECK (follow_up_status IN ('none','follow_up_later','invite_to_test','testimonial_candidate','case_study_candidate')) DEFAULT 'none',
  answers jsonb DEFAULT '{}',
  notes text DEFAULT '',
  pain_points text[] DEFAULT '{}',
  positive_reactions text[] DEFAULT '{}',
  suggested_improvements text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage interviews"
  ON public.user_interviews FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Interview insights / pattern tags
CREATE TABLE public.interview_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id uuid REFERENCES public.user_interviews(id) ON DELETE CASCADE NOT NULL,
  insight_text text NOT NULL,
  category text NOT NULL CHECK (category IN ('onboarding','card_editor','marketplace','social','estimates','invoices','confusing','high_value','churn_risk')),
  action_status text NOT NULL DEFAULT 'new' CHECK (action_status IN ('new','reviewing','planned','fixed','ignored')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.interview_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage insights"
  ON public.interview_insights FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_user_interviews_updated_at
  BEFORE UPDATE ON public.user_interviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interview_insights_updated_at
  BEFORE UPDATE ON public.interview_insights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
