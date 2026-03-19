-- Add contact_type enum
CREATE TYPE public.contact_type AS ENUM ('lead', 'client', 'vendor', 'partner', 'personal', 'other');

-- Add contact_type column to leads table
ALTER TABLE public.leads ADD COLUMN contact_type public.contact_type NOT NULL DEFAULT 'lead';

-- Add business_card source to lead_source enum
ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'business_card';