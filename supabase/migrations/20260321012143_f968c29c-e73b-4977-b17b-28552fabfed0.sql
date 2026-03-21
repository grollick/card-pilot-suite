-- Drop permissive INSERT policies on system_events
DROP POLICY IF EXISTS "Anon can insert system events" ON system_events;
DROP POLICY IF EXISTS "Authenticated users can insert system events" ON system_events;

-- Drop permissive INSERT policy on analytics_events (service role handles inserts)
DROP POLICY IF EXISTS "Public can insert analytics" ON analytics_events;

-- Fix invoice_line_items: require token match via request header
DROP POLICY IF EXISTS "Public can view invoice line items via token" ON invoice_line_items;
CREATE POLICY "Public can view invoice line items via token" ON invoice_line_items
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_line_items.invoice_id
      AND invoices.payment_token = (current_setting('request.headers', true)::json->>'x-payment-token')::uuid
    )
  );

-- Fix invoice_payments: require token match via request header
DROP POLICY IF EXISTS "Anon can view payments for valid invoice" ON invoice_payments;
CREATE POLICY "Anon can view payments for valid invoice" ON invoice_payments
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_payments.invoice_id
      AND invoices.payment_token = (current_setting('request.headers', true)::json->>'x-payment-token')::uuid
    )
  );