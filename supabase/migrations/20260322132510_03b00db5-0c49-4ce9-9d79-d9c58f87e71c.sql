
-- Fix the security definer view issue by setting it to security invoker
ALTER VIEW public.client_safe_profiles SET (security_invoker = on);
