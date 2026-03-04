
CREATE TABLE public.style_packs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  style text NOT NULL,
  recommended_for_categories jsonb NOT NULL DEFAULT '[]'::jsonb,
  theme_tokens jsonb NOT NULL DEFAULT '{}'::jsonb,
  default_palettes jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.style_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Style packs are publicly readable"
  ON public.style_packs FOR SELECT
  USING (true);
