
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, referred_by, signup_source, signup_utm_campaign, signup_utm_medium)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NULLIF(NEW.raw_user_meta_data->>'referred_by', ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'signup_source', ''), 'direct'),
    COALESCE(NEW.raw_user_meta_data->>'signup_utm_campaign', ''),
    COALESCE(NEW.raw_user_meta_data->>'signup_utm_medium', '')
  );
  RETURN NEW;
END;
$$;
