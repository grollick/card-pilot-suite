
-- Tighten anon insert: only allow if invoice_id references a valid invoice with payment_token
DROP POLICY IF EXISTS "Anon can insert payment via token" ON public.invoice_payments;
CREATE POLICY "Anon can insert payment for valid invoice"
  ON public.invoice_payments FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE id = invoice_id AND payment_token IS NOT NULL
    )
  );

-- Tighten anon select on line items: only for invoices with payment_token
DROP POLICY IF EXISTS "Public can view invoice line items" ON public.invoice_line_items;
CREATE POLICY "Public can view invoice line items via token"
  ON public.invoice_line_items FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE id = invoice_id AND payment_token IS NOT NULL
    )
  );

-- Tighten anon select on payments
DROP POLICY IF EXISTS "Anon can view payments" ON public.invoice_payments;
CREATE POLICY "Anon can view payments for valid invoice"
  ON public.invoice_payments FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE id = invoice_id AND payment_token IS NOT NULL
    )
  );
