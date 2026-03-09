
-- Scheduled followups queue
CREATE TABLE public.scheduled_followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  trigger_type text NOT NULL DEFAULT 'form_submit',
  recipient_name text,
  recipient_email text,
  send_at timestamptz NOT NULL,
  sent_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduled_followups ENABLE ROW LEVEL SECURITY;

-- RLS: service role processes them, users can view their own
CREATE POLICY "Users view own followups"
  ON public.scheduled_followups FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Public can insert followups"
  ON public.scheduled_followups FOR INSERT
  WITH CHECK (user_id IS NOT NULL);

CREATE POLICY "Users manage own followups"
  ON public.scheduled_followups FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add followup config to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS followup_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS followup_delay_minutes integer NOT NULL DEFAULT 120,
  ADD COLUMN IF NOT EXISTS followup_subject text DEFAULT 'Thanks for connecting, {{name}}!',
  ADD COLUMN IF NOT EXISTS followup_body text DEFAULT 'Hi {{name}},

Thanks for reaching out! I wanted to follow up personally and let you know I received your information.

I''d love to chat more about how I can help. Feel free to reply to this email or book a time on my calendar.

Looking forward to connecting!';
