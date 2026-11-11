DROP FUNCTION IF EXISTS public.get_public_invoice_payments(uuid);
CREATE FUNCTION public.get_public_invoice_payments(p_token uuid)
RETURNS TABLE(id uuid, amount numeric, payment_method text, payment_reference text, paid_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.amount, p.payment_method::text, p.payment_reference::text, p.paid_at FROM invoice_payments p JOIN invoices i ON i.id = p.invoice_id
  WHERE p_token IS NOT NULL AND i.payment_token = p_token ORDER BY p.created_at DESC;
$$;
GRANT EXECUTE ON FUNCTION public.get_public_invoice_payments(uuid) TO anon, authenticated;