CREATE OR REPLACE FUNCTION public.get_on_duty_providers(p_city text DEFAULT NULL, p_limit integer DEFAULT 8)
RETURNS TABLE(id uuid, name text, avatar_url text, city text, handle text, company text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.name, p.avatar_url, p.city, p.handle, p.company
  FROM public.profiles p
  JOIN public.estimate_duty_status d ON d.user_id = p.id AND d.is_on_duty = true
  WHERE p.handle IS NOT NULL
    AND COALESCE(p.is_suspended, false) = false
    AND EXISTS (SELECT 1 FROM public.cards c WHERE c.user_id = p.id AND c.status = 'published')
    AND (p_city IS NULL OR p_city = '' OR p.city ILIKE '%' || p_city || '%')
  ORDER BY p.updated_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 8), 1), 50);
$$;