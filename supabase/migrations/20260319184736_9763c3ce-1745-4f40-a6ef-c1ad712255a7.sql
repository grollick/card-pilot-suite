
-- Job request responses table for professionals responding to estimate_requests
CREATE TABLE public.job_request_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_request_id UUID NOT NULL REFERENCES public.estimate_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  price_estimate NUMERIC DEFAULT NULL,
  availability TEXT DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_request_responses ENABLE ROW LEVEL SECURITY;

-- Professionals can manage their own responses
CREATE POLICY "Users manage own job request responses"
ON public.job_request_responses
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Public can view responses by request (for customer view via token)
CREATE POLICY "Public can view responses by request"
ON public.job_request_responses
FOR SELECT
TO anon, authenticated
USING (true);

-- Add tracking_token to estimate_requests for customer follow-up
ALTER TABLE public.estimate_requests ADD COLUMN IF NOT EXISTS tracking_token TEXT DEFAULT encode(extensions.gen_random_bytes(16), 'hex');

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_job_request_responses_request_id ON public.job_request_responses(estimate_request_id);
CREATE INDEX IF NOT EXISTS idx_estimate_requests_tracking_token ON public.estimate_requests(tracking_token);
