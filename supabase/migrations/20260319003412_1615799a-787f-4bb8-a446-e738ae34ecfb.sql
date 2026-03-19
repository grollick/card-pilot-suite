-- Pay-per-lead billing tracking
CREATE TABLE IF NOT EXISTS public.marketplace_lead_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'marketplace',
  billed boolean NOT NULL DEFAULT false,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.marketplace_lead_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own lead credits"
  ON public.marketplace_lead_credits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System insert lead credits"
  ON public.marketplace_lead_credits FOR INSERT
  TO authenticated
  WITH CHECK (user_id IS NOT NULL);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS featured_until timestamptz;

CREATE OR REPLACE FUNCTION public.log_marketplace_lead_credit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.source IN ('marketplace', 'discover', 'card_form', 'booking') THEN
    INSERT INTO marketplace_lead_credits (user_id, lead_id, source)
    VALUES (NEW.user_id, NEW.id, NEW.source::text);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_marketplace_lead_credit
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.log_marketplace_lead_credit();

CREATE INDEX IF NOT EXISTS idx_marketplace_lead_credits_user ON public.marketplace_lead_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_lead_credits_created ON public.marketplace_lead_credits(created_at);