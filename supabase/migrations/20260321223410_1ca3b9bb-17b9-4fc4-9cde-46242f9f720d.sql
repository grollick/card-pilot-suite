
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signup_source text DEFAULT 'direct';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signup_utm_campaign text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signup_utm_medium text DEFAULT '';
