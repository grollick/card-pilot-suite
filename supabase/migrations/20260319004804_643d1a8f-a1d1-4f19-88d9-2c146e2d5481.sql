
-- Add available_for_work toggle to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS available_for_work boolean NOT NULL DEFAULT true;

-- Add response_time_minutes (cached avg) for smart ranking
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avg_response_minutes integer;
