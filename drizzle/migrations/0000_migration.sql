DROP POLICY IF EXISTS "Public can view invoice line items via token" ON public.invoice_line_items;
DROP POLICY IF EXISTS "Anon can view payments for valid invoice" ON public.invoice_payments;
DROP POLICY IF EXISTS "Public can read by exact token" ON public.client_portal_tokens;
DROP POLICY IF EXISTS "Portal token scoped insert" ON public.client_portal_messages;
DROP POLICY IF EXISTS "Public can view availability" ON public.availability_rules;
CREATE POLICY "Owners insert portal messages" ON public.client_portal_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.get_portal_session(p_token text)
RETURNS TABLE(lead_id uuid, user_id uuid, expires_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.lead_id, t.user_id, t.expires_at FROM client_portal_tokens t
  WHERE p_token IS NOT NULL AND t.token::text = p_token AND t.expires_at > now() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.send_portal_message(p_token text, p_message text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_lead uuid; v_user uuid;
BEGIN
  IF p_message IS NULL OR length(trim(p_message)) = 0 OR length(p_message) > 5000 THEN
    RAISE EXCEPTION 'Invalid message' USING ERRCODE = '22023';
  END IF;
  SELECT t.lead_id, t.user_id INTO v_lead, v_user FROM client_portal_tokens t
  WHERE t.token::text = p_token AND t.expires_at > now() LIMIT 1;
  IF v_lead IS NULL THEN RAISE EXCEPTION 'Invalid or expired portal link' USING ERRCODE = '42501'; END IF;
  INSERT INTO client_portal_messages (user_id, lead_id, message, sender) VALUES (v_user, v_lead, trim(p_message), 'client');
END; $$;

CREATE OR REPLACE FUNCTION public.get_public_invoice_line_items(p_token uuid)
RETURNS SETOF public.invoice_line_items LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT li.* FROM invoice_line_items li JOIN invoices i ON i.id = li.invoice_id
  WHERE p_token IS NOT NULL AND i.payment_token = p_token ORDER BY li.sort_order;
$$;

CREATE OR REPLACE FUNCTION public.get_public_invoice_payments(p_token uuid)
RETURNS TABLE(id uuid, amount numeric, payment_method text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.amount, p.payment_method::text, p.created_at FROM invoice_payments p JOIN invoices i ON i.id = p.invoice_id
  WHERE p_token IS NOT NULL AND i.payment_token = p_token ORDER BY p.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_availability_by_user(p_user_id uuid)
RETURNS TABLE(day_of_week integer, start_time time, end_time time, buffer_min integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.day_of_week::integer, a.start_time::time, a.end_time::time, a.buffer_min::integer
  FROM availability_rules a WHERE a.user_id = p_user_id ORDER BY a.day_of_week;
$$;

GRANT EXECUTE ON FUNCTION public.get_portal_session(text), public.send_portal_message(text,text), public.get_public_invoice_line_items(uuid), public.get_public_invoice_payments(uuid), public.get_availability_by_user(uuid) TO anon, authenticated;