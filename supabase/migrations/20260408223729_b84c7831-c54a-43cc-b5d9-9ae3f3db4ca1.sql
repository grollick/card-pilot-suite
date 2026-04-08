
-- Add is_demo flag to businesses
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

-- Create index for quick demo filtering
CREATE INDEX IF NOT EXISTS idx_businesses_is_demo ON public.businesses (is_demo) WHERE is_demo = true;
