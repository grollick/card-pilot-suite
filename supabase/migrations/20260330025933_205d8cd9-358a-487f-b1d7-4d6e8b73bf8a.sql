CREATE OR REPLACE VIEW public.copilot_booking_context AS
SELECT
  bb.id AS booking_id,
  bb.business_id,
  b.business_name,
  bb.customer_name,
  bb.customer_email,
  bb.customer_phone,
  bb.booking_date,
  bb.booking_time,
  bb.status,
  bb.notes,
  s.title AS service_title
FROM business_bookings bb
JOIN businesses b ON b.id = bb.business_id
LEFT JOIN services s ON s.id = bb.service_id;

ALTER VIEW public.copilot_booking_context SET (security_invoker = true);