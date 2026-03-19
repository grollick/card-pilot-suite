
-- Roadmap status enum
CREATE TYPE public.roadmap_status AS ENUM ('backlog', 'next_up', 'in_progress', 'done');

-- Priority level enum
CREATE TYPE public.priority_level AS ENUM ('critical', 'high', 'medium', 'low');

-- Bug issues table with priority scoring and grouping
CREATE TABLE public.bug_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  feature_tag text,
  impact_score smallint NOT NULL DEFAULT 1 CHECK (impact_score BETWEEN 1 AND 5),
  frequency_score smallint NOT NULL DEFAULT 1 CHECK (frequency_score BETWEEN 1 AND 5),
  revenue_risk_score smallint NOT NULL DEFAULT 1 CHECK (revenue_risk_score BETWEEN 1 AND 5),
  priority_score smallint GENERATED ALWAYS AS (impact_score * frequency_score * revenue_risk_score) STORED,
  priority_level public.priority_level NOT NULL DEFAULT 'low',
  report_count integer NOT NULL DEFAULT 1,
  roadmap_status public.roadmap_status NOT NULL DEFAULT 'backlog',
  feedback_ids uuid[] DEFAULT '{}',
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_bug_issues_priority ON public.bug_issues (priority_score DESC);
CREATE INDEX idx_bug_issues_roadmap ON public.bug_issues (roadmap_status);
CREATE INDEX idx_bug_issues_level ON public.bug_issues (priority_level);

-- RLS
ALTER TABLE public.bug_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on bug_issues"
  ON public.bug_issues FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE TRIGGER update_bug_issues_updated_at
  BEFORE UPDATE ON public.bug_issues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-calculate priority level from score
CREATE OR REPLACE FUNCTION public.auto_set_priority_level()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.priority_level := CASE
    WHEN (NEW.impact_score * NEW.frequency_score * NEW.revenue_risk_score) >= 64 THEN 'critical'
    WHEN (NEW.impact_score * NEW.frequency_score * NEW.revenue_risk_score) >= 27 THEN 'high'
    WHEN (NEW.impact_score * NEW.frequency_score * NEW.revenue_risk_score) >= 8 THEN 'medium'
    ELSE 'low'
  END;
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_priority_level
  BEFORE INSERT OR UPDATE OF impact_score, frequency_score, revenue_risk_score ON public.bug_issues
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_priority_level();
