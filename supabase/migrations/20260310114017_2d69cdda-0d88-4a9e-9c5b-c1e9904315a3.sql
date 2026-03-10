
-- Token-based portal access for customers (leads)
CREATE TABLE public.client_portal_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '90 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_portal_tokens_token ON public.client_portal_tokens(token);
CREATE INDEX idx_portal_tokens_lead ON public.client_portal_tokens(lead_id);

ALTER TABLE public.client_portal_tokens ENABLE ROW LEVEL SECURITY;

-- Business owners manage their own tokens
CREATE POLICY "Users manage own portal tokens"
  ON public.client_portal_tokens FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Public read by token (for portal access)
CREATE POLICY "Public can read by token"
  ON public.client_portal_tokens FOR SELECT
  TO anon, authenticated
  USING (token IS NOT NULL AND expires_at > now());

-- Client portal messages (simple contact form)
CREATE TABLE public.client_portal_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  sender text NOT NULL DEFAULT 'client',
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_portal_messages_lead ON public.client_portal_messages(lead_id);

ALTER TABLE public.client_portal_messages ENABLE ROW LEVEL SECURITY;

-- Business owners manage messages
CREATE POLICY "Users manage own portal messages"
  ON public.client_portal_messages FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Public can insert messages (client sending from portal)
CREATE POLICY "Public can insert portal messages"
  ON public.client_portal_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (user_id IS NOT NULL AND lead_id IS NOT NULL AND message IS NOT NULL);

-- Public can read messages by lead (for portal display)
CREATE POLICY "Public can read portal messages"
  ON public.client_portal_messages FOR SELECT
  TO anon, authenticated
  USING (true);
