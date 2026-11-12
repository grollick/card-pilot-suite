ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS tax_percent numeric NOT NULL DEFAULT 0;
UPDATE public.invoices
SET tax_percent = CASE
  WHEN COALESCE(tax_total, 0) = 0 THEN 0
  WHEN COALESCE(subtotal, 0) - COALESCE(discount_amount, 0) = 0 THEN 0
  ELSE tax_total / (COALESCE(subtotal, 0) - COALESCE(discount_amount, 0)) * 100
END;