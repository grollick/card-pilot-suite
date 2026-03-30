
-- Fix security definer view by making it security invoker
ALTER VIEW public.ai_roi_metrics SET (security_invoker = on);
