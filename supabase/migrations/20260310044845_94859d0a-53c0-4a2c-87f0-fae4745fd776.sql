
-- Add owner_response and reported columns to reviews table
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS owner_response text;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS owner_response_at timestamptz;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS reported boolean NOT NULL DEFAULT false;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS reported_reason text;
