
-- Create invoice_payments table for tracking payments (supports partial payments in phase 2)
CREATE TABLE public.invoice_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'manual',
  payment_reference TEXT,
  notes TEXT,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add payment tracking fields to invoices
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS amount_paid NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS payment_reference TEXT,
  ADD COLUMN IF NOT EXISTS payment_token UUID UNIQUE DEFAULT gen_random_uuid();

-- Enable RLS
ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for invoice_payments
CREATE POLICY "Users can view own payments"
  ON public.invoice_payments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own payments"
  ON public.invoice_payments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own payments"
  ON public.invoice_payments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Public read policy for invoices via payment_token (for client pay page)
CREATE POLICY "Public can view invoice by payment_token"
  ON public.invoices FOR SELECT
  TO anon
  USING (payment_token IS NOT NULL);

-- Public can read line items for public invoices
CREATE POLICY "Public can view invoice line items"
  ON public.invoice_line_items FOR SELECT
  TO anon
  USING (true);

-- Allow anon to insert payments (for client pay page)
CREATE POLICY "Anon can insert payment via token"
  ON public.invoice_payments FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anon to read payments
CREATE POLICY "Anon can view payments"
  ON public.invoice_payments FOR SELECT
  TO anon
  USING (true);
