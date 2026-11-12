ALTER TABLE public.professions ADD COLUMN created_by uuid DEFAULT auth.uid();
CREATE POLICY "Users can create own custom professions" ON public.professions FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() AND category = 'Other' AND default_card_sections = '[]'::jsonb AND default_pipeline_stages = '[]'::jsonb AND default_booking_services = '[]'::jsonb AND default_email_templates = '[]'::jsonb);
GRANT SELECT, INSERT ON public.professions TO authenticated;
GRANT ALL ON public.professions TO service_role;