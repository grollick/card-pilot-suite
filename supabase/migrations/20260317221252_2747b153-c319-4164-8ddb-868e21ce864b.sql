
-- automation_runs: tracks scheduled and executed automation actions
CREATE TABLE IF NOT EXISTS public.automation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id uuid REFERENCES public.automation_rules(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'scheduled',
  scheduled_for timestamptz NOT NULL DEFAULT now(),
  executed_at timestamptz,
  meta_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_automation_runs"
  ON public.automation_runs FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_automation_runs_user_status ON public.automation_runs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_automation_runs_scheduled ON public.automation_runs(status, scheduled_for) WHERE status = 'scheduled';

-- Add new trigger types to automation_rules defaults
-- (the table already exists, no schema changes needed)
