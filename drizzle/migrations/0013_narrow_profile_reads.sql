-- Batch N step 1: narrow, read-only functions so the app no longer needs
-- the broad public read on profiles. No policy or grant on profiles changes here.

CREATE OR REPLACE FUNCTION public.get_public_card_profile(p_handle text)
RETURNS TABLE(
  id uuid, name text, handle text, email text, phone text, company text, city text,
  avatar_url text, primary_cta text, style_pack text, profession_id uuid,
  verification_level text, available_for_work boolean, avg_response_minutes integer,
  profession_name text, profession_category text, is_on_duty boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.name, p.handle,
         CASE WHEN pub.has_card THEN p.email END,
         CASE WHEN pub.has_card THEN p.phone END,
         p.company, p.city, p.avatar_url, p.primary_cta, p.style_pack, p.profession_id,
         p.verification_level::text, p.available_for_work, p.avg_response_minutes,
         pr.name, pr.category,
         COALESCE(d.is_on_duty, false)
  FROM public.profiles p
  LEFT JOIN public.professions pr ON pr.id = p.profession_id
  LEFT JOIN public.estimate_duty_status d ON d.user_id = p.id
  CROSS JOIN LATERAL (
    SELECT EXISTS (SELECT 1 FROM public.cards c WHERE c.user_id = p.id AND c.status = 'published') AS has_card
  ) pub
  WHERE p_handle IS NOT NULL
    AND p.handle = p_handle
    AND COALESCE(p.is_suspended, false) = false
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_public_card_profile(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_card_profile(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_handle_available(p_handle text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p_handle IS NOT NULL AND length(trim(p_handle)) > 0
     AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE handle = lower(trim(p_handle)));
$$;
REVOKE ALL ON FUNCTION public.is_handle_available(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_handle_available(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_org_member_profiles(p_org_id uuid)
RETURNS TABLE(id uuid, name text, email text, avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.name, p.email, p.avatar_url
  FROM public.organization_members m
  JOIN public.profiles p ON p.id = m.user_id
  WHERE m.org_id = p_org_id
    AND public.is_org_member(auth.uid(), p_org_id);
$$;
REVOKE ALL ON FUNCTION public.get_org_member_profiles(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_org_member_profiles(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.find_user_for_org_invite(p_org_id uuid, p_email text)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id FROM public.profiles p
  WHERE public.is_org_admin(auth.uid(), p_org_id)
    AND p_email IS NOT NULL
    AND lower(p.email) = lower(trim(p_email))
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.find_user_for_org_invite(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_user_for_org_invite(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_referral_leaderboard(p_limit integer DEFAULT 10)
RETURNS TABLE(rank integer, first_name text, total_referrals bigint, completed_referrals bigint, total_reward_days bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT (row_number() OVER (ORDER BY count(*) FILTER (WHERE r.status = 'completed') DESC, count(*) DESC))::integer,
         NULLIF(split_part(trim(COALESCE(p.name, '')), ' ', 1), ''),
         count(*),
         count(*) FILTER (WHERE r.status = 'completed'),
         COALESCE(sum(r.reward_days) FILTER (WHERE r.status = 'completed'), 0)::bigint
  FROM public.referrals r
  JOIN public.profiles p ON p.id = r.referrer_id
  WHERE auth.uid() IS NOT NULL
  GROUP BY r.referrer_id, p.name
  ORDER BY 1
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 10), 1), 50);
$$;
REVOKE ALL ON FUNCTION public.get_referral_leaderboard(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_referral_leaderboard(integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_client_business_profiles(p_ids uuid[])
RETURNS TABLE(id uuid, name text, company text, avatar_url text, city text, phone text, handle text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.name, p.company, p.avatar_url, p.city, p.phone, p.handle
  FROM public.profiles p
  WHERE p.id = ANY(p_ids)
    AND EXISTS (
      SELECT 1 FROM public.leads l
      JOIN public.client_profiles cp ON cp.user_id = auth.uid()
      WHERE l.user_id = p.id AND cp.email IS NOT NULL AND l.email = cp.email
    );
$$;
REVOKE ALL ON FUNCTION public.get_client_business_profiles(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_client_business_profiles(uuid[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_portal_business_profile(p_token text)
RETURNS TABLE(name text, company text, handle text, avatar_url text, city text, bio text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.name, p.company, p.handle, p.avatar_url, p.city, p.bio
  FROM public.client_portal_tokens t
  JOIN public.profiles p ON p.id = t.user_id
  WHERE p_token IS NOT NULL AND t.token::text = p_token AND t.expires_at > now()
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_portal_business_profile(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_portal_business_profile(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_on_duty_providers(p_city text DEFAULT NULL, p_limit integer DEFAULT 8)
RETURNS TABLE(id uuid, name text, avatar_url text, city text, handle text, company text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.name, p.avatar_url, p.city, p.handle, p.company
  FROM public.profiles p
  JOIN public.estimate_duty_status d ON d.user_id = p.id AND d.is_on_duty = true
  WHERE p.handle IS NOT NULL
    AND COALESCE(p.is_suspended, false) = false
    AND (p_city IS NULL OR p_city = '' OR p.city ILIKE '%' || p_city || '%')
  ORDER BY p.updated_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 8), 1), 50);
$$;
REVOKE ALL ON FUNCTION public.get_on_duty_providers(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_on_duty_providers(text, integer) TO anon, authenticated;