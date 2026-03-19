-- Fix lead_routing_log: Restrict to own user_id
DROP POLICY IF EXISTS "Service can insert routing logs" ON public.lead_routing_log;

CREATE POLICY "Auth users can insert own routing logs"
ON public.lead_routing_log
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Fix estimate_duty_log: The old policy may still exist alongside new one
DROP POLICY IF EXISTS "System can insert duty log" ON public.estimate_duty_log;
