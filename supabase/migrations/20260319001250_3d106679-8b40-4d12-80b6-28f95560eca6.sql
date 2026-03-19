
-- Table to track purchased AI credit packs
CREATE TABLE public.ai_credit_purchases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  credits_purchased integer NOT NULL DEFAULT 0,
  credits_remaining integer NOT NULL DEFAULT 0,
  purchase_type text NOT NULL DEFAULT 'topup',
  stripe_payment_intent_id text,
  amount_paid numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + interval '1 year')
);

ALTER TABLE public.ai_credit_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own credit purchases"
  ON public.ai_credit_purchases FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own credit purchases"
  ON public.ai_credit_purchases FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own credit purchases"
  ON public.ai_credit_purchases FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_ai_credit_purchases_user ON public.ai_credit_purchases (user_id, credits_remaining);

-- Update the check_and_increment function to also check purchased credits
CREATE OR REPLACE FUNCTION public.check_and_increment_ai_usage(p_user_id uuid, p_limit integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_month_key text;
  v_current integer;
  v_bonus integer;
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
  
  -- Sum remaining purchased credits (not expired)
  SELECT COALESCE(SUM(credits_remaining), 0) INTO v_bonus
  FROM ai_credit_purchases
  WHERE user_id = p_user_id 
    AND credits_remaining > 0 
    AND (expires_at IS NULL OR expires_at > now());
  
  -- Check limit (-1 means unlimited)
  -- Allow if within plan limit OR has purchased credits
  IF p_limit != -1 AND v_current >= p_limit THEN
    -- Plan limit reached, try purchased credits
    IF v_bonus <= 0 THEN
      RETURN jsonb_build_object(
        'allowed', false, 
        'current', v_current, 
        'limit', p_limit, 
        'bonus_remaining', 0
      );
    END IF;
    
    -- Deduct from oldest purchased credit pack
    UPDATE ai_credit_purchases
    SET credits_remaining = credits_remaining - 1
    WHERE id = (
      SELECT id FROM ai_credit_purchases
      WHERE user_id = p_user_id 
        AND credits_remaining > 0 
        AND (expires_at IS NULL OR expires_at > now())
      ORDER BY created_at ASC
      LIMIT 1
    );
    
    -- Still increment usage counter for tracking
    UPDATE ai_usage
    SET request_count = request_count + 1, updated_at = now()
    WHERE user_id = p_user_id AND month_key = v_month_key;
    
    RETURN jsonb_build_object(
      'allowed', true, 
      'current', v_current + 1, 
      'limit', p_limit, 
      'bonus_remaining', v_bonus - 1,
      'used_bonus', true
    );
  END IF;
  
  -- Within plan limit, just increment
  UPDATE ai_usage
  SET request_count = request_count + 1, updated_at = now()
  WHERE user_id = p_user_id AND month_key = v_month_key;
  
  RETURN jsonb_build_object(
    'allowed', true, 
    'current', v_current + 1, 
    'limit', p_limit, 
    'bonus_remaining', v_bonus,
    'used_bonus', false
  );
END;
$$;
