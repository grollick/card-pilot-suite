
-- Lead scores table
CREATE TABLE IF NOT EXISTS public.lead_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.business_leads(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0,
  label text NOT NULL DEFAULT 'Low Intent',
  explanation text,
  recommended_action text,
  scoring_factors jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(lead_id)
);

CREATE INDEX IF NOT EXISTS idx_lead_scores_business ON lead_scores(business_id);
CREATE INDEX IF NOT EXISTS idx_lead_scores_score ON lead_scores(business_id, score DESC);

ALTER TABLE public.lead_scores ENABLE ROW LEVEL SECURITY;

-- RLS: owners can read/write their business lead scores
CREATE POLICY "Business owners can manage lead scores"
  ON public.lead_scores
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = lead_scores.business_id
        AND b.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = lead_scores.business_id
        AND b.owner_user_id = auth.uid()
    )
  );
