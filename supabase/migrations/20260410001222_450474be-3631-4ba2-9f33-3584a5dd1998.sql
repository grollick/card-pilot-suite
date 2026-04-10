ALTER TABLE public.profiles ADD COLUMN marketplace_categories text[] DEFAULT '{}';

COMMENT ON COLUMN public.profiles.marketplace_categories IS 'AI-suggested marketplace category keys for this user';