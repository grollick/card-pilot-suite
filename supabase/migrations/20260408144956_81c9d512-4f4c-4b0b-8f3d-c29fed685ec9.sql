
CREATE OR REPLACE VIEW public.referral_leaderboard
WITH (security_invoker = on)
AS
SELECT
  r.referrer_id,
  p.name AS referrer_name,
  p.avatar_url,
  COUNT(*) AS total_referrals,
  COUNT(*) FILTER (WHERE r.status = 'completed') AS completed_referrals,
  COALESCE(SUM(r.reward_days) FILTER (WHERE r.status = 'completed'), 0) AS total_reward_days
FROM referrals r
JOIN profiles p ON p.id = r.referrer_id
GROUP BY r.referrer_id, p.name, p.avatar_url
ORDER BY completed_referrals DESC, total_referrals DESC
LIMIT 50;
