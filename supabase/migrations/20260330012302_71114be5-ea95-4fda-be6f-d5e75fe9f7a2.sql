
-- Fix security definer view by setting it to use invoker's permissions
ALTER VIEW public.business_pipeline_summary SET (security_invoker = on);
