
-- Add white-label columns to organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS custom_domain text,
  ADD COLUMN IF NOT EXISTS custom_email_from text,
  ADD COLUMN IF NOT EXISTS white_label_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS powered_by_text text,
  ADD COLUMN IF NOT EXISTS brand_color text;
