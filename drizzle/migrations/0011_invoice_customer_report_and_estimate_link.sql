ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS customer_reported_at timestamptz,
  ADD COLUMN IF NOT EXISTS customer_reported_method text,
  ADD COLUMN IF NOT EXISTS customer_reported_reference text,
  ADD COLUMN IF NOT EXISTS customer_reported_note text,
  ADD COLUMN IF NOT EXISTS estimate_id uuid REFERENCES public.estimates(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS invoices_estimate_id_idx ON public.invoices(estimate_id);