
-- Fix: Replace overly permissive SELECT policy on estimate_duty_services
-- Only expose service associations for users who are currently on duty
DROP POLICY IF EXISTS "Public can view on-duty services" ON estimate_duty_services;

CREATE POLICY "Public can view on-duty services"
  ON estimate_duty_services FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM estimate_duty_status eds
      WHERE eds.user_id = estimate_duty_services.user_id
        AND eds.is_on_duty = true
    )
  );
