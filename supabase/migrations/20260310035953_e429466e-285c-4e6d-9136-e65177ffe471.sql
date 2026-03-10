
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS marketplace_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS service_area text,
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;
