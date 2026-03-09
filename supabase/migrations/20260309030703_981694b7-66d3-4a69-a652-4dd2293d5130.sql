
-- Multi-step follow-up sequences
CREATE TABLE public.followup_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  step_number integer NOT NULL DEFAULT 1,
  delay_minutes integer NOT NULL DEFAULT 120,
  subject text NOT NULL DEFAULT 'Following up, {{name}}!',
  body text NOT NULL DEFAULT 'Hi {{name}}, just checking in!',
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, step_number)
);

ALTER TABLE public.followup_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own followup steps"
  ON public.followup_steps FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Add step reference to scheduled_followups
ALTER TABLE public.scheduled_followups
  ADD COLUMN IF NOT EXISTS step_id uuid REFERENCES public.followup_steps(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS step_number integer DEFAULT 1;
