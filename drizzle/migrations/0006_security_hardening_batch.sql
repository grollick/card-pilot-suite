-- Internal-only functions
REVOKE ALL ON FUNCTION public.create_notification(uuid,text,text,text,text,uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_notification(uuid,text,text,text,text,uuid,text) TO service_role;
REVOKE ALL ON FUNCTION public.create_workspace_from_profession(uuid,uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_workspace_from_profession(uuid,uuid,text) TO service_role;
REVOKE ALL ON FUNCTION public.enqueue_email(text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_email(text,jsonb) TO service_role;
REVOKE ALL ON FUNCTION public.read_email_batch(text,int4,int4) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text,int4,int4) TO service_role;
REVOKE ALL ON FUNCTION public.delete_email(text,int8) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_email(text,int8) TO service_role;

-- get_effective_plan: own account or admin only
CREATE OR REPLACE FUNCTION public.get_effective_plan(p_user_id uuid)
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE r jsonb;
BEGIN
  IF auth.role() <> 'service_role' AND (auth.uid() IS NULL OR (auth.uid() <> p_user_id
     AND NOT public.has_role(auth.uid(),'admin') AND NOT public.has_role(auth.uid(),'founder'))) THEN
    RAISE EXCEPTION 'not allowed' USING errcode = '42501';
  END IF;
  SELECT COALESCE(
    (SELECT jsonb_build_object('plan', ba.granted_plan,'is_beta', true,'beta_id', ba.id,'expiry_date', ba.expiry_date)
     FROM beta_access ba WHERE ba.user_id = p_user_id AND ba.is_active AND ba.expiry_date > now() AND ba.start_date <= now()
     ORDER BY ba.expiry_date DESC LIMIT 1),
    jsonb_build_object('plan', COALESCE((SELECT plan FROM profiles WHERE id = p_user_id), 'starter'),'is_beta', false,'beta_id', null,'expiry_date', null)
  ) INTO r;
  RETURN r;
END $$;
REVOKE ALL ON FUNCTION public.get_effective_plan(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_effective_plan(uuid) TO authenticated, service_role;

-- increment_boost_views: never count the owner, at most one count per boost per minute
CREATE OR REPLACE FUNCTION public.increment_boost_views(p_user_id uuid)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() = p_user_id THEN RETURN; END IF;
  UPDATE neighborhood_boosts SET views_count = views_count + 1, updated_at = now()
  WHERE user_id = p_user_id AND status = 'active' AND expires_at > now()
    AND (updated_at IS NULL OR updated_at < now() - interval '1 minute');
END $$;

-- Protect privileged profile fields from self-edits
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_fields()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $$
BEGIN
  IF current_user IN ('authenticated','anon')
     AND NOT public.has_role(auth.uid(),'admin') AND NOT public.has_role(auth.uid(),'founder') THEN
    IF TG_OP = 'UPDATE' THEN
      NEW.plan := OLD.plan; NEW.verification_level := OLD.verification_level;
      NEW.trust_level := OLD.trust_level; NEW.trust_score := OLD.trust_score;
      NEW.trust_signals := OLD.trust_signals; NEW.abuse_flags := OLD.abuse_flags;
      NEW.is_suspended := OLD.is_suspended; NEW.suspended_reason := OLD.suspended_reason;
      NEW.featured := OLD.featured; NEW.featured_until := OLD.featured_until;
    ELSE
      NEW.plan := 'free'; NEW.verification_level := 'basic'; NEW.trust_level := 'new';
      NEW.trust_score := 10; NEW.trust_signals := NULL; NEW.abuse_flags := NULL;
      NEW.is_suspended := false; NEW.suspended_reason := NULL; NEW.featured := false; NEW.featured_until := NULL;
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_protect_profile_privileged_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_privileged_fields BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileged_fields();

-- Tighten read policies
DROP POLICY IF EXISTS "Anyone can read variants" ON public.ab_test_variants;
CREATE POLICY "Anyone can read variants of active tests" ON public.ab_test_variants FOR SELECT TO anon, authenticated
USING (test_id IN (SELECT id FROM public.ab_tests WHERE status = 'active'));

DROP POLICY IF EXISTS "Anyone can read events" ON public.ab_test_events;
CREATE POLICY "Admins read events" ON public.ab_test_events FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Public can view marketplace metrics" ON public.marketplace_metrics;
CREATE POLICY "Public can view metrics of listed businesses" ON public.marketplace_metrics FOR SELECT TO anon, authenticated
USING (business_id IN (SELECT id FROM public.businesses WHERE is_active AND is_marketplace_visible));

DROP POLICY IF EXISTS "Public can view service areas" ON public.service_areas;
CREATE POLICY "Public can view service areas of listed businesses" ON public.service_areas FOR SELECT TO anon, authenticated
USING (business_id IN (SELECT id FROM public.businesses WHERE is_active AND is_marketplace_visible));

DROP POLICY IF EXISTS "Public can view app reviews" ON public.app_reviews;
CREATE POLICY "Signed-in users can view app reviews" ON public.app_reviews FOR SELECT TO authenticated USING (true);

-- Feedback screenshots: own folder only (feedback/<uid>/...)
DROP POLICY IF EXISTS "Authenticated users can upload feedback screenshots" ON storage.objects;
CREATE POLICY "Authenticated users can upload feedback screenshots" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'feedback-screenshots'
  AND (storage.foldername(name))[1] = 'feedback'
  AND (storage.foldername(name))[2] = (select auth.uid()::text)
  AND storage.extension(name) = ANY (ARRAY['jpg','jpeg','png','gif','webp']));