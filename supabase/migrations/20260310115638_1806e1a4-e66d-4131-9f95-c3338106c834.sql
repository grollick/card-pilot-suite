
-- Helper: check if user is manager or above in org using text cast to avoid enum commit issue
CREATE OR REPLACE FUNCTION public.is_org_manager_or_above(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE user_id = _user_id AND org_id = _org_id AND role::text IN ('owner', 'admin', 'manager')
  )
$$;
