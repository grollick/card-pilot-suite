
-- Estimate sections (room/area grouping)
CREATE TABLE public.estimate_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id uuid NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
  name text NOT NULL,
  notes text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.estimate_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own estimate sections" ON public.estimate_sections
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.estimates WHERE estimates.id = estimate_sections.estimate_id AND estimates.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.estimates WHERE estimates.id = estimate_sections.estimate_id AND estimates.user_id = auth.uid()));

CREATE INDEX idx_estimate_sections_estimate_id ON public.estimate_sections(estimate_id);

-- Extend line items with calc mode, dimensions, section, optional flag
ALTER TABLE public.estimate_line_items
  ADD COLUMN section_id uuid REFERENCES public.estimate_sections(id) ON DELETE SET NULL,
  ADD COLUMN calc_mode text NOT NULL DEFAULT 'manual',
  ADD COLUMN calc_length numeric NOT NULL DEFAULT 0,
  ADD COLUMN calc_width numeric NOT NULL DEFAULT 0,
  ADD COLUMN calc_depth numeric NOT NULL DEFAULT 0,
  ADD COLUMN is_optional boolean NOT NULL DEFAULT false;

CREATE INDEX idx_estimate_line_items_section_id ON public.estimate_line_items(section_id);

-- Financial controls on estimates
ALTER TABLE public.estimates
  ADD COLUMN discount_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN discount_percent numeric NOT NULL DEFAULT 0,
  ADD COLUMN deposit_percent numeric NOT NULL DEFAULT 0,
  ADD COLUMN deposit_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN terms_conditions text,
  ADD COLUMN internal_notes text,
  ADD COLUMN converted_booking_id uuid REFERENCES public.bookings(id),
  ADD COLUMN approved_at timestamptz,
  ADD COLUMN declined_at timestamptz;

-- Saved cost presets
CREATE TABLE public.estimate_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  preset_type text NOT NULL,
  name text NOT NULL,
  value numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.estimate_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own estimate presets" ON public.estimate_presets
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_estimate_presets_user_id ON public.estimate_presets(user_id);
