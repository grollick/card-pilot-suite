ALTER TABLE public.estimates
  ADD COLUMN IF NOT EXISTS share_token text,
  ADD COLUMN IF NOT EXISTS sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS viewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS response_name text,
  ADD COLUMN IF NOT EXISTS response_note text;
CREATE UNIQUE INDEX IF NOT EXISTS estimates_share_token_key ON public.estimates (share_token) WHERE share_token IS NOT NULL;