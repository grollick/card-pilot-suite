CREATE TABLE public.estimate_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id uuid NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
  line_item_id uuid REFERENCES public.estimate_line_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  caption text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.estimate_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own estimate photos"
  ON public.estimate_photos FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_estimate_photos_estimate ON public.estimate_photos(estimate_id);
CREATE INDEX idx_estimate_photos_line_item ON public.estimate_photos(line_item_id);