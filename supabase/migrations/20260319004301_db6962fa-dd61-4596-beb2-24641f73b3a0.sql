
-- Sales CRM pipeline stages enum
CREATE TYPE public.sales_crm_stage AS ENUM (
  'new_lead', 'contacted', 'interested', 'card_built', 'got_first_lead', 'paid', 'upsell'
);

-- Internal sales CRM contacts table
CREATE TABLE public.sales_crm_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  business_name text,
  email text,
  phone text,
  stage sales_crm_stage NOT NULL DEFAULT 'new_lead',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_sales_crm_contacts_user_id ON public.sales_crm_contacts(user_id);
CREATE INDEX idx_sales_crm_contacts_stage ON public.sales_crm_contacts(stage);

-- RLS
ALTER TABLE public.sales_crm_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sales crm contacts"
  ON public.sales_crm_contacts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at
CREATE TRIGGER trg_sales_crm_contacts_updated_at
  BEFORE UPDATE ON public.sales_crm_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
