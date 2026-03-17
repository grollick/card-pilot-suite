
-- Add source column if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reviews' AND column_name='source') THEN
    ALTER TABLE public.reviews ADD COLUMN source text NOT NULL DEFAULT 'cardpilot';
  END IF;
END $$;

-- Change default of is_public to false (moderation-first)
ALTER TABLE public.reviews ALTER COLUMN is_public SET DEFAULT false;

-- Remove duplicate RLS policies
DROP POLICY IF EXISTS "public_view_public_reviews" ON public.reviews;
DROP POLICY IF EXISTS "users_manage_own_reviews" ON public.reviews;
