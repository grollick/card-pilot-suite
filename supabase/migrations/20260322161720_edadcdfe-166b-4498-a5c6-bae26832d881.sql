
-- Fix linter warning: set public_profiles view to security_invoker
-- The underlying get_public_profiles() function is SECURITY DEFINER
-- so anon access still works through the function
ALTER VIEW public.public_profiles SET (security_invoker = on);
