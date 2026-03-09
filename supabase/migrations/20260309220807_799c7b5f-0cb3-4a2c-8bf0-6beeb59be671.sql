
-- Estimate status enum
CREATE TYPE public.estimate_status AS ENUM ('draft', 'sent', 'viewed', 'approved', 'declined', 'expired');

-- Estimates table
CREATE TABLE public.estimates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  estimate_number text NOT NULL,
  status public.estimate_status NOT NULL DEFAULT 'draft',
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  expiry_date date,
  job_address text,
  job_type text,
  scope_of_work text,
  notes text,
  subtotal numeric NOT NULL DEFAULT 0,
  labor_total numeric NOT NULL DEFAULT 0,
  material_total numeric NOT NULL DEFAULT 0,
  markup_total numeric NOT NULL DEFAULT 0,
  tax_total numeric NOT NULL DEFAULT 0,
  grand_total numeric NOT NULL DEFAULT 0,
  template_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Line items table
CREATE TABLE public.estimate_line_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_id uuid NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  quantity numeric NOT NULL DEFAULT 1,
  unit text DEFAULT 'each',
  unit_price numeric NOT NULL DEFAULT 0,
  labor_hours numeric DEFAULT 0,
  labor_rate numeric DEFAULT 0,
  material_cost numeric DEFAULT 0,
  markup_percent numeric DEFAULT 0,
  tax_percent numeric DEFAULT 0,
  line_total numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_estimates_user_id ON public.estimates(user_id);
CREATE INDEX idx_estimates_lead_id ON public.estimates(lead_id);
CREATE INDEX idx_estimates_status ON public.estimates(status);
CREATE INDEX idx_estimate_line_items_estimate_id ON public.estimate_line_items(estimate_id);

-- RLS
ALTER TABLE public.estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own estimates" ON public.estimates FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own estimate line items" ON public.estimate_line_items FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.estimates WHERE estimates.id = estimate_line_items.estimate_id AND estimates.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.estimates WHERE estimates.id = estimate_line_items.estimate_id AND estimates.user_id = auth.uid())
);

-- Updated_at trigger
CREATE TRIGGER update_estimates_updated_at BEFORE UPDATE ON public.estimates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
