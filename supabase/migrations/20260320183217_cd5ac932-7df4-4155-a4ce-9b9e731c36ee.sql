
-- Signup abuse log for tracking attempts
CREATE TABLE public.signup_abuse_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  email_domain text,
  fingerprint_hash text,
  email text,
  risk_level text NOT NULL DEFAULT 'low',
  flags text[] DEFAULT '{}',
  blocked boolean DEFAULT false,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for IP-based rate limiting queries
CREATE INDEX idx_signup_abuse_ip ON public.signup_abuse_log(ip_hash, created_at DESC);
CREATE INDEX idx_signup_abuse_fingerprint ON public.signup_abuse_log(fingerprint_hash, created_at DESC) WHERE fingerprint_hash IS NOT NULL;
CREATE INDEX idx_signup_abuse_domain ON public.signup_abuse_log(email_domain, created_at DESC) WHERE email_domain IS NOT NULL;

-- Enable RLS
ALTER TABLE public.signup_abuse_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read abuse log
CREATE POLICY "Admins can read abuse log" ON public.signup_abuse_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Edge functions can insert (no JWT check needed for public signup endpoint)
CREATE POLICY "Service can insert abuse log" ON public.signup_abuse_log
  FOR INSERT WITH CHECK (true);

-- Add trust_level to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trust_level text NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS abuse_flags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended_reason text;
