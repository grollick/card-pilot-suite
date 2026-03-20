
-- Lead assignment settings per organization
CREATE TABLE public.lead_assignment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  assignment_mode text NOT NULL DEFAULT 'manual',
  fallback_to_owner boolean NOT NULL DEFAULT true,
  match_by_services boolean NOT NULL DEFAULT false,
  match_by_location boolean NOT NULL DEFAULT false,
  filter_by_availability boolean NOT NULL DEFAULT false,
  round_robin_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.lead_assignment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own lead assignment settings"
  ON public.lead_assignment_settings FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Lead assignments tracking
CREATE TABLE public.lead_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  assigned_to uuid NOT NULL,
  assigned_by uuid,
  org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  assignment_mode text NOT NULL DEFAULT 'manual',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own lead assignments"
  ON public.lead_assignments FOR SELECT
  TO authenticated
  USING (assigned_to = auth.uid() OR assigned_by = auth.uid());

CREATE POLICY "Users insert lead assignments"
  ON public.lead_assignments FOR INSERT
  TO authenticated
  WITH CHECK (assigned_by = auth.uid());

CREATE POLICY "Users update own lead assignments"
  ON public.lead_assignments FOR UPDATE
  TO authenticated
  USING (assigned_by = auth.uid() OR assigned_to = auth.uid());

-- Index for fast lookups
CREATE INDEX idx_lead_assignments_assigned_to ON public.lead_assignments(assigned_to);
CREATE INDEX idx_lead_assignments_lead_id ON public.lead_assignments(lead_id);
CREATE INDEX idx_lead_assignments_org_id ON public.lead_assignments(org_id);
