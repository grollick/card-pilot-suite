
-- Add lead_id to bookings so every booking links back to a contact
ALTER TABLE public.bookings ADD COLUMN lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL;

-- Add lead_id to analytics_events so card views/clicks link to a contact
ALTER TABLE public.analytics_events ADD COLUMN lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL;

-- Add lead_id to social_posts so social content can be linked to a contact
ALTER TABLE public.social_posts ADD COLUMN lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL;

-- Create a contact_activities table for a unified timeline
CREATE TABLE public.contact_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  activity_type text NOT NULL, -- 'note', 'call', 'email_sent', 'booking_created', 'task_created', 'form_submit', 'card_view', 'cta_click'
  title text NOT NULL,
  description text,
  related_id uuid, -- optional FK to bookings, campaigns, tasks etc
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own contact activities"
  ON public.contact_activities FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create a tasks table properly linked to contacts
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  title text NOT NULL,
  due_date date,
  priority text NOT NULL DEFAULT 'medium', -- 'high', 'medium', 'low'
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tasks"
  ON public.tasks FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Index for fast timeline lookups
CREATE INDEX idx_contact_activities_lead ON public.contact_activities(lead_id, created_at DESC);
CREATE INDEX idx_tasks_lead ON public.tasks(lead_id);
CREATE INDEX idx_bookings_lead ON public.bookings(lead_id);
CREATE INDEX idx_analytics_lead ON public.analytics_events(lead_id);
