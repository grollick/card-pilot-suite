
-- App marketplace tables

-- Categories enum
CREATE TYPE public.app_category AS ENUM ('payments', 'accounting', 'marketing', 'automation', 'analytics', 'industry_tools', 'communication', 'productivity');

-- Pricing model enum
CREATE TYPE public.app_pricing_type AS ENUM ('free', 'paid_once', 'subscription');

-- Marketplace apps catalog
CREATE TABLE public.marketplace_apps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  developer_name TEXT NOT NULL DEFAULT 'CardPilot',
  description TEXT NOT NULL,
  long_description TEXT,
  icon_url TEXT,
  screenshot_urls TEXT[] DEFAULT '{}',
  category app_category NOT NULL DEFAULT 'productivity',
  pricing_type app_pricing_type NOT NULL DEFAULT 'free',
  price_amount NUMERIC DEFAULT 0,
  features TEXT[] DEFAULT '{}',
  permissions TEXT[] DEFAULT '{}',
  webhook_url TEXT,
  config_schema JSONB DEFAULT '{}',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT true,
  avg_rating NUMERIC NOT NULL DEFAULT 0,
  install_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marketplace_apps ENABLE ROW LEVEL SECURITY;

-- Anyone can browse the marketplace
CREATE POLICY "Public can view published apps"
  ON public.marketplace_apps FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

-- Installed apps per user
CREATE TABLE public.installed_apps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id UUID NOT NULL REFERENCES public.marketplace_apps(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.organizations(id),
  enabled BOOLEAN NOT NULL DEFAULT true,
  config JSONB DEFAULT '{}',
  installed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, app_id)
);

ALTER TABLE public.installed_apps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own installed apps"
  ON public.installed_apps FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- App reviews
CREATE TABLE public.app_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  app_id UUID NOT NULL REFERENCES public.marketplace_apps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, app_id)
);

ALTER TABLE public.app_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view app reviews"
  ON public.app_reviews FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users manage own app reviews"
  ON public.app_reviews FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_marketplace_apps_category ON public.marketplace_apps(category);
CREATE INDEX idx_marketplace_apps_featured ON public.marketplace_apps(is_featured) WHERE is_featured = true;
CREATE INDEX idx_installed_apps_user ON public.installed_apps(user_id);
CREATE INDEX idx_app_reviews_app ON public.app_reviews(app_id);

-- Seed featured apps
INSERT INTO public.marketplace_apps (name, slug, developer_name, description, category, pricing_type, price_amount, features, is_featured, install_count) VALUES
  ('Stripe Payments', 'stripe-payments', 'CardPilot', 'Accept payments and manage subscriptions directly from your card and booking system.', 'payments', 'free', 0, ARRAY['Invoice payments', 'Subscription billing', 'Payment links', 'Refund management'], true, 2840),
  ('QuickBooks Sync', 'quickbooks-sync', 'CardPilot', 'Automatically sync estimates, jobs, and invoices with QuickBooks Online.', 'accounting', 'subscription', 9.99, ARRAY['Auto-sync estimates', 'Expense tracking', 'Tax reports', 'Invoice matching'], true, 1520),
  ('Mailchimp Connect', 'mailchimp-connect', 'CardPilot', 'Sync your CRM contacts to Mailchimp audiences and automate email campaigns.', 'marketing', 'free', 0, ARRAY['Contact sync', 'Audience segmentation', 'Campaign triggers', 'Analytics'], true, 3200),
  ('Zapier Automation', 'zapier-automation', 'CardPilot', 'Connect CardPilot with 5000+ apps through Zapier workflows.', 'automation', 'free', 0, ARRAY['Trigger on new lead', 'Booking webhooks', 'Job status updates', 'Custom workflows'], true, 4100),
  ('Google Analytics', 'google-analytics', 'CardPilot', 'Track card views, conversions, and user behavior with Google Analytics integration.', 'analytics', 'free', 0, ARRAY['Page view tracking', 'Conversion goals', 'UTM support', 'Real-time data'], true, 5600),
  ('Square POS', 'square-pos', 'CardPilot', 'Accept in-person payments and sync transactions with your CardPilot jobs.', 'payments', 'free', 0, ARRAY['POS integration', 'Tap to pay', 'Receipt sync', 'Inventory tracking'], false, 890),
  ('Twilio SMS', 'twilio-sms', 'CardPilot', 'Send automated SMS reminders for bookings and follow-ups.', 'communication', 'subscription', 4.99, ARRAY['Booking reminders', 'Follow-up texts', 'Two-way SMS', 'Templates'], false, 1100),
  ('Google Calendar', 'google-calendar', 'CardPilot', 'Two-way sync between CardPilot bookings and Google Calendar.', 'productivity', 'free', 0, ARRAY['Two-way sync', 'Availability check', 'Auto-block', 'Team calendars'], true, 6200),
  ('Xero Accounting', 'xero-accounting', 'CardPilot', 'Sync invoices and expenses to Xero for seamless bookkeeping.', 'accounting', 'subscription', 9.99, ARRAY['Invoice sync', 'Expense categories', 'Bank feeds', 'Tax compliance'], false, 720),
  ('ServiceTitan Connect', 'servicetitan-connect', 'ServiceTitan', 'Import jobs and customers from ServiceTitan into CardPilot.', 'industry_tools', 'paid_once', 49.99, ARRAY['Job import', 'Customer sync', 'Dispatch integration', 'Reporting'], false, 340),
  ('HubSpot CRM', 'hubspot-crm', 'CardPilot', 'Two-way sync contacts and deals between CardPilot and HubSpot.', 'marketing', 'free', 0, ARRAY['Contact sync', 'Deal tracking', 'Activity logging', 'Pipeline mapping'], true, 2100),
  ('Slack Notifications', 'slack-notifications', 'CardPilot', 'Get instant Slack notifications for new leads, bookings, and job updates.', 'communication', 'free', 0, ARRAY['Lead alerts', 'Booking notifications', 'Job updates', 'Custom channels'], false, 1800);
