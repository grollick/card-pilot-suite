
-- Growth automation workflows table
CREATE TABLE public.growth_automation_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  workflow_type text NOT NULL DEFAULT 'outreach',
  status text NOT NULL DEFAULT 'draft',
  trigger_config jsonb NOT NULL DEFAULT '{}',
  action_config jsonb NOT NULL DEFAULT '{}',
  stats_json jsonb NOT NULL DEFAULT '{"sent":0,"opened":0,"replied":0,"converted":0}',
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.growth_automation_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage workflows"
  ON public.growth_automation_workflows FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Outreach follow-ups tracking
ALTER TABLE public.outreach_contacts ADD COLUMN IF NOT EXISTS profession text;
ALTER TABLE public.outreach_contacts ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.outreach_contacts ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.outreach_contacts ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.outreach_contacts ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual';
ALTER TABLE public.outreach_contacts ADD COLUMN IF NOT EXISTS followup_count integer DEFAULT 0;
ALTER TABLE public.outreach_contacts ADD COLUMN IF NOT EXISTS next_followup_at timestamptz;
ALTER TABLE public.outreach_contacts ADD COLUMN IF NOT EXISTS flagged_for_handoff boolean DEFAULT false;
ALTER TABLE public.outreach_contacts ADD COLUMN IF NOT EXISTS handoff_reason text;

-- Growth automation log for tracking all automated actions
CREATE TABLE public.growth_automation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES public.growth_automation_workflows(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  target_user_id uuid,
  target_contact_id uuid REFERENCES public.outreach_contacts(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  result_json jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.growth_automation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage automation log"
  ON public.growth_automation_log FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
