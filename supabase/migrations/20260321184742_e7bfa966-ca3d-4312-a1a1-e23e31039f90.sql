
-- Protect the founder account from suspension
-- This trigger prevents ANY update that would suspend or remove the founder role

CREATE OR REPLACE FUNCTION public.protect_founder_account()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_is_founder boolean;
BEGIN
  -- Check if the user being modified is the founder
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = NEW.id AND role = 'founder'
  ) INTO v_is_founder;

  IF v_is_founder THEN
    -- Prevent suspension
    NEW.is_suspended := false;
    -- Prevent trust score from going to zero
    IF NEW.trust_score IS NOT NULL AND NEW.trust_score < 60 THEN
      NEW.trust_score := 100;
    END IF;
    -- Ensure trust level stays high
    NEW.trust_level := 'trusted';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protect_founder_profile
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_founder_account();

-- Prevent deletion of founder role
CREATE OR REPLACE FUNCTION public.prevent_founder_role_removal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF OLD.role = 'founder' THEN
    RAISE EXCEPTION 'Cannot remove founder role';
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_prevent_founder_role_delete
  BEFORE DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_founder_role_removal();

-- Prevent changing founder role to something else
CREATE OR REPLACE FUNCTION public.prevent_founder_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF OLD.role = 'founder' AND NEW.role != 'founder' THEN
    RAISE EXCEPTION 'Cannot change founder role';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_founder_role_update
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_founder_role_change();
