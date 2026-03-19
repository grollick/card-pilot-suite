
-- Table to store marketplace quote requests from visitors
CREATE TABLE public.marketplace_quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text,
  service_needed text,
  budget text,
  timeline text,
  profession text,
  location text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS (public insert, no read for anon)
ALTER TABLE public.marketplace_quote_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a quote request"
  ON public.marketplace_quote_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Table to track lead routing to businesses
CREATE TABLE public.lead_routing_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id uuid REFERENCES public.marketplace_quote_requests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'delivered',
  delivered_at timestamptz NOT NULL DEFAULT now(),
  viewed_at timestamptz,
  responded_at timestamptz,
  converted_at timestamptz,
  reminder_1h_sent boolean NOT NULL DEFAULT false,
  reminder_24h_sent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_routing_log ENABLE ROW LEVEL SECURITY;

-- Business owners can see their own routed leads
CREATE POLICY "Users can view their own routed leads"
  ON public.lead_routing_log FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Business owners can update their own (mark as viewed/responded)
CREATE POLICY "Users can update their own routed leads"
  ON public.lead_routing_log FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Service role inserts (from edge functions)
CREATE POLICY "Service can insert routing logs"
  ON public.lead_routing_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_lead_routing_log_user_id ON public.lead_routing_log(user_id);
CREATE INDEX idx_lead_routing_log_quote_request_id ON public.lead_routing_log(quote_request_id);
CREATE INDEX idx_lead_routing_log_status ON public.lead_routing_log(status);
