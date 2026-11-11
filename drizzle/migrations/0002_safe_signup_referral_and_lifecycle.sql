CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  referral_text text := NULLIF(NEW.raw_user_meta_data->>'referred_by', '');
  referral_id uuid;
BEGIN
  IF referral_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    SELECT id INTO referral_id FROM auth.users WHERE id = referral_text::uuid;
  END IF;
  INSERT INTO public.profiles (id, email, name, referred_by, signup_source, signup_utm_campaign, signup_utm_medium)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', ''), referral_id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'signup_source', ''), 'direct'),
    COALESCE(NEW.raw_user_meta_data->>'signup_utm_campaign', ''),
    COALESCE(NEW.raw_user_meta_data->>'signup_utm_medium', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE OR REPLACE FUNCTION public.create_first_lead_guarantee()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  BEGIN
    INSERT INTO public.first_lead_guarantee (user_id, activated_at, deadline_at)
    VALUES (NEW.id, now(), now() + interval '24 hours')
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Optional first-lead guarantee failed for %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$;