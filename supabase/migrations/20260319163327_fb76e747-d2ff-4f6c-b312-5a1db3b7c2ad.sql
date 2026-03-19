
ALTER TABLE public.social_posts 
  ADD COLUMN IF NOT EXISTS clicks integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS link_clicks integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS leads_generated integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bookings_generated integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS engagement_score numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS content_type text DEFAULT null,
  ADD COLUMN IF NOT EXISTS performance_notes text DEFAULT null;
