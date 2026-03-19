
-- Beta access table
CREATE TABLE public.beta_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_plan text NOT NULL DEFAULT 'growth',
  start_date timestamptz NOT NULL DEFAULT now(),
  expiry_date timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_by_admin uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for quick lookups
CREATE INDEX idx_beta_access_user_active ON public.beta_access (user_id, is_active);
CREATE INDEX idx_beta_access_expiry ON public.beta_access (expiry_date) WHERE is_active = true;

-- RLS
ALTER TABLE public.beta_access ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins full access on beta_access"
  ON public.beta_access FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Users can read their own beta access
CREATE POLICY "Users can view own beta_access"
  ON public.beta_access FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Function to get effective plan considering beta access
CREATE OR REPLACE FUNCTION public.get_effective_plan(p_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT jsonb_build_object(
        'plan', ba.granted_plan,
        'is_beta', true,
        'beta_id', ba.id,
        'expiry_date', ba.expiry_date
      )
      FROM beta_access ba
      WHERE ba.user_id = p_user_id
        AND ba.is_active = true
        AND ba.expiry_date > now()
        AND ba.start_date <= now()
      ORDER BY ba.expiry_date DESC
      LIMIT 1
    ),
    jsonb_build_object(
      'plan', COALESCE((SELECT plan FROM profiles WHERE id = p_user_id), 'starter'),
      'is_beta', false,
      'beta_id', null,
      'expiry_date', null
    )
  );
$$;

-- Function to expire beta access (called by cron or edge function)
CREATE OR REPLACE FUNCTION public.expire_beta_access()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_count integer;
BEGIN
  UPDATE beta_access
  SET is_active = false, updated_at = now()
  WHERE is_active = true AND expiry_date <= now();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$;

-- Updated_at trigger
CREATE TRIGGER update_beta_access_updated_at
  BEFORE UPDATE ON public.beta_access
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
