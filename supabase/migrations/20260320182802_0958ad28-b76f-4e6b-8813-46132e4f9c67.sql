
-- Add recovery columns to lead_assignments
ALTER TABLE public.lead_assignments
  ADD COLUMN IF NOT EXISTS responded_at timestamptz,
  ADD COLUMN IF NOT EXISTS missed_at timestamptz,
  ADD COLUMN IF NOT EXISTS recovery_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS reassigned_from uuid,
  ADD COLUMN IF NOT EXISTS timeout_minutes integer NOT NULL DEFAULT 15;

-- Add recovery settings to lead_assignment_settings
ALTER TABLE public.lead_assignment_settings
  ADD COLUMN IF NOT EXISTS recovery_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS timeout_minutes integer NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS recovery_mode text NOT NULL DEFAULT 'reassign';

-- Index for recovery queries
CREATE INDEX IF NOT EXISTS idx_lead_assignments_recovery ON public.lead_assignments(status, recovery_status, created_at) WHERE status = 'active' AND recovery_status = 'none';
