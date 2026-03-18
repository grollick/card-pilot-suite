
CREATE TYPE public.system_event_severity AS ENUM ('info', 'warning', 'error', 'critical');

CREATE TABLE public.system_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  severity system_event_severity NOT NULL DEFAULT 'error',
  message text NOT NULL,
  meta_data jsonb DEFAULT '{}'::jsonb,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_system_events_created_at ON public.system_events (created_at DESC);
CREATE INDEX idx_system_events_severity ON public.system_events (severity);
CREATE INDEX idx_system_events_event_type ON public.system_events (event_type);

ALTER TABLE public.system_events ENABLE ROW LEVEL SECURITY;

-- Admins can view all system events
CREATE POLICY "Admins can view system events"
  ON public.system_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Any authenticated user can insert (for logging their own errors)
CREATE POLICY "Authenticated users can insert system events"
  ON public.system_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Service role / edge functions can insert via anon too
CREATE POLICY "Anon can insert system events"
  ON public.system_events FOR INSERT
  TO anon
  WITH CHECK (true);
