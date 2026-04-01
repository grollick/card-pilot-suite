-- Fix invoices FK to allow lead deletion
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_lead_id_fkey;
ALTER TABLE public.invoices 
  ADD CONSTRAINT invoices_lead_id_fkey 
  FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;

-- Fix recurring_plans FK to allow lead deletion
ALTER TABLE public.recurring_plans DROP CONSTRAINT IF EXISTS recurring_plans_lead_id_fkey;
ALTER TABLE public.recurring_plans 
  ADD CONSTRAINT recurring_plans_lead_id_fkey 
  FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;