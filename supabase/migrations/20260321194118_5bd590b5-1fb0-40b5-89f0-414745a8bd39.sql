
-- First Lead Guarantee tracking table
CREATE TABLE public.first_lead_guarantee (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activated_at timestamptz NOT NULL DEFAULT now(),
  deadline_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  status text NOT NULL DEFAULT 'monitoring'
    CHECK (status IN ('monitoring', 'matched', 'test_delivered', 'responded', 'expired')),
  first_lead_at timestamptz,
  first_response_at timestamptz,
  test_lead_id uuid,
  matched_request_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.first_lead_guarantee ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own guarantee"
  ON public.first_lead_guarantee FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage guarantees"
  ON public.first_lead_guarantee FOR ALL
  TO service_role
  USING (true);

-- Auto-create guarantee record when a profile is created (new signup)
CREATE OR REPLACE FUNCTION public.create_first_lead_guarantee()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.first_lead_guarantee (user_id, activated_at, deadline_at)
  VALUES (NEW.id, now(), now() + interval '24 hours')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_create_first_lead_guarantee
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_first_lead_guarantee();
