
-- Email sequence types
CREATE TYPE public.sequence_trigger AS ENUM ('signup', 'incomplete_profile', 'inactivity', 'lead_activity', 'beta_expiry', 'manual');
CREATE TYPE public.sequence_status AS ENUM ('active', 'paused', 'draft');
CREATE TYPE public.enrollment_status AS ENUM ('active', 'completed', 'cancelled', 'paused');

-- Sequences table
CREATE TABLE public.email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type sequence_trigger NOT NULL DEFAULT 'manual',
  trigger_config JSONB NOT NULL DEFAULT '{}',
  status sequence_status NOT NULL DEFAULT 'draft',
  max_emails_per_day INT NOT NULL DEFAULT 2,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sequence steps
CREATE TABLE public.email_sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID REFERENCES public.email_sequences(id) ON DELETE CASCADE NOT NULL,
  step_number INT NOT NULL DEFAULT 1,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  delay_hours INT NOT NULL DEFAULT 24,
  enabled BOOLEAN NOT NULL DEFAULT true,
  stop_conditions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sequence_id, step_number)
);

-- Enrollments
CREATE TABLE public.email_sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID REFERENCES public.email_sequences(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  current_step INT NOT NULL DEFAULT 0,
  status enrollment_status NOT NULL DEFAULT 'active',
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_email_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sequence_id, user_id)
);

-- Event log
CREATE TABLE public.email_sequence_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES public.email_sequence_enrollments(id) ON DELETE CASCADE NOT NULL,
  step_id UUID REFERENCES public.email_sequence_steps(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  meta_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_seq_steps_sequence ON public.email_sequence_steps(sequence_id);
CREATE INDEX idx_seq_enrollments_user ON public.email_sequence_enrollments(user_id);
CREATE INDEX idx_seq_enrollments_status ON public.email_sequence_enrollments(status);
CREATE INDEX idx_seq_events_enrollment ON public.email_sequence_events(enrollment_id);

-- RLS
ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sequence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sequence_events ENABLE ROW LEVEL SECURITY;

-- Admin-only policies (using has_role function)
CREATE POLICY "Admins can manage sequences" ON public.email_sequences
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage sequence steps" ON public.email_sequence_steps
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage enrollments" ON public.email_sequence_enrollments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage sequence events" ON public.email_sequence_events
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Updated_at triggers
CREATE TRIGGER update_email_sequences_updated_at BEFORE UPDATE ON public.email_sequences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_email_sequence_steps_updated_at BEFORE UPDATE ON public.email_sequence_steps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_email_sequence_enrollments_updated_at BEFORE UPDATE ON public.email_sequence_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
