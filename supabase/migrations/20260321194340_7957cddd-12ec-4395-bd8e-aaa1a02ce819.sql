-- Seed guarantee records for existing users who don't have one yet
INSERT INTO public.first_lead_guarantee (user_id, activated_at, deadline_at, status)
SELECT p.id, p.created_at, p.created_at + interval '24 hours',
  CASE 
    WHEN EXISTS (SELECT 1 FROM leads l WHERE l.user_id = p.id LIMIT 1) THEN 'matched'
    WHEN p.created_at + interval '24 hours' < now() THEN 'expired'
    ELSE 'monitoring'
  END
FROM profiles p
WHERE NOT EXISTS (SELECT 1 FROM first_lead_guarantee g WHERE g.user_id = p.id)
ON CONFLICT (user_id) DO NOTHING;