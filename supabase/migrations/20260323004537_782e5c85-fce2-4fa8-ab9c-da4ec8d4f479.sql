
-- Fix the trigger function that references a non-existent enum value 'discover'
CREATE OR REPLACE FUNCTION public.log_marketplace_lead_credit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.source::text IN ('marketplace', 'card_form', 'booking') THEN
    INSERT INTO marketplace_lead_credits (user_id, lead_id, source)
    VALUES (NEW.user_id, NEW.id, NEW.source::text);
  END IF;
  RETURN NEW;
END;
$function$;
