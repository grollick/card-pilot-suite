
CREATE TABLE public.ai_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  month_key text NOT NULL,
  request_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, month_key)
);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own AI usage"
  ON public.ai_usage FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own AI usage"
  ON public.ai_usage FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own AI usage"
  ON public.ai_usage FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role function to check and increment AI usage (used by edge functions)
CREATE OR REPLACE FUNCTION public.check_and_increment_ai_usage(p_user_id uuid, p_limit integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_month_key text;
  v_current integer;
BEGIN
  v_month_key := to_char(now(), 'YYYY-MM');
  
  -- Upsert the usage row
  INSERT INTO ai_usage (user_id, month_key, request_count)
  VALUES (p_user_id, v_month_key, 0)
  ON CONFLICT (user_id, month_key) DO NOTHING;
  
  -- Get current count
  SELECT request_count INTO v_current
  FROM ai_usage
  WHERE user_id = p_user_id AND month_key = v_month_key;
  
  -- Check limit (-1 means unlimited)
  IF p_limit != -1 AND v_current >= p_limit THEN
    RETURN jsonb_build_object('allowed', false, 'current', v_current, 'limit', p_limit);
  END IF;
  
  -- Increment
  UPDATE ai_usage
  SET request_count = request_count + 1, updated_at = now()
  WHERE user_id = p_user_id AND month_key = v_month_key;
  
  RETURN jsonb_build_object('allowed', true, 'current', v_current + 1, 'limit', p_limit);
END;
$$;
