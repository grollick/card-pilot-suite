
CREATE TABLE IF NOT EXISTS public.ai_lead_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.business_leads(id) ON DELETE CASCADE,
  score integer NOT NULL,
  label text NOT NULL,
  explanation text,
  recommended_action text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (lead_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_lead_scores_business ON public.ai_lead_scores(business_id);
CREATE INDEX IF NOT EXISTS idx_ai_lead_scores_score ON public.ai_lead_scores(business_id, score DESC);

ALTER TABLE public.ai_lead_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners manage lead scores"
  ON public.ai_lead_scores
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = ai_lead_scores.business_id AND b.owner_user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = ai_lead_scores.business_id AND b.owner_user_id = auth.uid())
  );

-- Validation trigger instead of CHECK constraint for score range
CREATE OR REPLACE FUNCTION public.validate_ai_lead_score()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.score < 1 OR NEW.score > 100 THEN
    RAISE EXCEPTION 'score must be between 1 and 100';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_ai_lead_score
  BEFORE INSERT OR UPDATE ON public.ai_lead_scores
  FOR EACH ROW EXECUTE FUNCTION public.validate_ai_lead_score();
