
-- Create quote_requests table
CREATE TABLE public.quote_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  project_type TEXT,
  budget TEXT,
  location TEXT,
  timeline TEXT,
  description TEXT,
  photo_urls TEXT[] DEFAULT '{}',
  form_answers JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

-- Owner can manage their quote requests
CREATE POLICY "Users manage own quote requests"
  ON public.quote_requests FOR ALL
  USING (auth.uid() = user_id);

-- Public can insert quote requests (visitors submitting forms)
CREATE POLICY "Public can insert quote requests"
  ON public.quote_requests FOR INSERT
  WITH CHECK (user_id IS NOT NULL);

-- Index for fast lookups
CREATE INDEX idx_quote_requests_user_id ON public.quote_requests(user_id);
CREATE INDEX idx_quote_requests_lead_id ON public.quote_requests(lead_id);

-- Updated_at trigger
CREATE TRIGGER update_quote_requests_updated_at
  BEFORE UPDATE ON public.quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
