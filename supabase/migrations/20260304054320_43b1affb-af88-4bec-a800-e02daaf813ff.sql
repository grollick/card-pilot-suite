
-- ============================================================
-- 1. CONTACTS (leads table) — add HubSpot-style fields
-- ============================================================
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_activity_at timestamptz,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS assigned_to_user_id uuid,
  ADD COLUMN IF NOT EXISTS company text;

-- Expand lead_source enum
ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'referral';
ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'other';

-- ============================================================
-- 2. PIPELINE STAGES — add is_won / is_lost
-- ============================================================
ALTER TABLE public.pipeline_stages
  ADD COLUMN IF NOT EXISTS is_won boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_lost boolean NOT NULL DEFAULT false;

-- ============================================================
-- 3. TASKS — enrich with type, status, remind, booking, assign
-- ============================================================
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'follow_up',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS remind_at timestamptz,
  ADD COLUMN IF NOT EXISTS booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS assigned_to_user_id uuid;

-- ============================================================
-- 4. CONTACT ACTIVITIES — add occurred_at, created_by
-- ============================================================
ALTER TABLE public.contact_activities
  ADD COLUMN IF NOT EXISTS occurred_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid;

-- ============================================================
-- 5. BOOKINGS — expand status enum, add internal_notes
-- ============================================================
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'requested';
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'no_show';

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS internal_notes text;

-- ============================================================
-- 6. TAGS — proper tag + contact_tag tables
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  color text DEFAULT '#6366f1',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tags"
  ON public.tags FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.contact_tags (
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (lead_id, tag_id)
);

ALTER TABLE public.contact_tags ENABLE ROW LEVEL SECURITY;

-- RLS via security definer to avoid recursion
CREATE OR REPLACE FUNCTION public.owns_lead(_user_id uuid, _lead_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.leads WHERE id = _lead_id AND user_id = _user_id)
$$;

CREATE POLICY "Users manage own contact tags"
  ON public.contact_tags FOR ALL
  TO authenticated
  USING (public.owns_lead(auth.uid(), lead_id));

-- ============================================================
-- 7. TRIGGERS — auto-update last_activity_at + next_activity_at
-- ============================================================

-- 7a. When an activity event is inserted → update contact.last_activity_at
CREATE OR REPLACE FUNCTION public.update_contact_last_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.leads
  SET last_activity_at = COALESCE(NEW.occurred_at, NEW.created_at),
      updated_at = now()
  WHERE id = NEW.lead_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_activity_update_last ON public.contact_activities;
CREATE TRIGGER trg_activity_update_last
  AFTER INSERT ON public.contact_activities
  FOR EACH ROW
  WHEN (NEW.lead_id IS NOT NULL)
  EXECUTE FUNCTION public.update_contact_last_activity();

-- 7b. When a task is created/updated → recalc contact.next_activity_at
CREATE OR REPLACE FUNCTION public.update_contact_next_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _lead_id uuid;
  _next timestamptz;
BEGIN
  _lead_id := COALESCE(NEW.lead_id, OLD.lead_id);
  IF _lead_id IS NULL THEN RETURN NEW; END IF;

  SELECT MIN(due_date::timestamptz)
  INTO _next
  FROM public.tasks
  WHERE lead_id = _lead_id AND status = 'open';

  UPDATE public.leads
  SET next_activity_at = _next,
      updated_at = now()
  WHERE id = _lead_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_task_update_next ON public.tasks;
CREATE TRIGGER trg_task_update_next
  AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_contact_next_activity();

-- ============================================================
-- 8. INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_leads_last_activity ON public.leads(last_activity_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_leads_next_activity ON public.leads(next_activity_at ASC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON public.tasks(due_date ASC NULLS LAST) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_contact_tags_tag ON public.contact_tags(tag_id);
