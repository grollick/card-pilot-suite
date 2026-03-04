
-- ================================================
-- CardPilot Complete Database Schema
-- ================================================

-- 1. Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.card_status AS ENUM ('draft', 'published', 'unpublished');
CREATE TYPE public.lead_source AS ENUM ('card_form', 'booking', 'manual', 'import');
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE public.campaign_status AS ENUM ('draft', 'sending', 'sent', 'paused');
CREATE TYPE public.campaign_email_status AS ENUM ('pending', 'sent', 'failed', 'bounced');
CREATE TYPE public.social_post_status AS ENUM ('draft', 'scheduled', 'published', 'failed');
CREATE TYPE public.analytics_event_type AS ENUM ('card_view', 'button_click', 'form_submit', 'booking_created');

-- 2. Timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 3. Professions table (public, admin-managed)
CREATE TABLE public.professions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  default_card_sections JSONB NOT NULL DEFAULT '[]',
  default_pipeline_stages JSONB NOT NULL DEFAULT '[]',
  default_booking_services JSONB NOT NULL DEFAULT '[]',
  default_email_templates JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.professions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Professions are publicly readable" ON public.professions FOR SELECT USING (true);

-- 4. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  handle TEXT UNIQUE,
  profession_id UUID REFERENCES public.professions(id),
  plan TEXT NOT NULL DEFAULT 'free',
  avatar_url TEXT,
  company TEXT,
  phone TEXT,
  primary_cta TEXT DEFAULT 'call',
  style_pack TEXT DEFAULT 'modern',
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Public profiles by handle" ON public.profiles FOR SELECT USING (handle IS NOT NULL);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. User roles (separate table per security requirements)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Auto-assign 'user' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created_role
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- 6. Cards
CREATE TABLE public.cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status card_status NOT NULL DEFAULT 'draft',
  theme_json JSONB NOT NULL DEFAULT '{}',
  sections_json JSONB NOT NULL DEFAULT '[]',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own cards" ON public.cards FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON public.cards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Brand Kits
CREATE TABLE public.brand_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#6366f1',
  secondary_color TEXT DEFAULT '#818cf8',
  font_family TEXT DEFAULT 'Inter',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.brand_kits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own brand kit" ON public.brand_kits FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER update_brand_kits_updated_at BEFORE UPDATE ON public.brand_kits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Pipeline Stages
CREATE TABLE public.pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own stages" ON public.pipeline_stages FOR ALL USING (auth.uid() = user_id);

-- 9. Leads
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  source lead_source NOT NULL DEFAULT 'manual',
  stage_id UUID REFERENCES public.pipeline_stages(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own leads" ON public.leads FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Booking Services
CREATE TABLE public.booking_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration_min INT NOT NULL DEFAULT 30,
  price NUMERIC(10,2),
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.booking_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own services" ON public.booking_services FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public can view active services by user" ON public.booking_services FOR SELECT USING (active = true);
CREATE TRIGGER update_booking_services_updated_at BEFORE UPDATE ON public.booking_services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Availability Rules
CREATE TABLE public.availability_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  buffer_min INT NOT NULL DEFAULT 15,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.availability_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own availability" ON public.availability_rules FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public can view availability" ON public.availability_rules FOR SELECT USING (true);

-- 12. Bookings
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.booking_services(id) ON DELETE SET NULL,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  notes TEXT,
  status booking_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own bookings" ON public.bookings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public can create bookings" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 13. Email Templates
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own templates" ON public.email_templates FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON public.email_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 14. Campaigns
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status campaign_status NOT NULL DEFAULT 'draft',
  template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own campaigns" ON public.campaigns FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 15. Campaign Emails
CREATE TABLE public.campaign_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  status campaign_email_status NOT NULL DEFAULT 'pending',
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.campaign_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own campaign emails" ON public.campaign_emails FOR ALL
  USING (EXISTS (SELECT 1 FROM public.campaigns WHERE campaigns.id = campaign_emails.campaign_id AND campaigns.user_id = auth.uid()));

-- 16. Social Accounts
CREATE TABLE public.social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  account_name TEXT,
  connected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own social accounts" ON public.social_accounts FOR ALL USING (auth.uid() = user_id);

-- 17. Social Posts
CREATE TABLE public.social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_urls TEXT[],
  scheduled_at TIMESTAMPTZ,
  status social_post_status NOT NULL DEFAULT 'draft',
  platforms_json JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own posts" ON public.social_posts FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER update_social_posts_updated_at BEFORE UPDATE ON public.social_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 18. Analytics Events
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  handle TEXT NOT NULL,
  event_type analytics_event_type NOT NULL,
  meta_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own analytics" ON public.analytics_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public can insert analytics" ON public.analytics_events FOR INSERT WITH CHECK (true);
CREATE INDEX idx_analytics_user_created ON public.analytics_events (user_id, created_at DESC);
CREATE INDEX idx_analytics_handle ON public.analytics_events (handle);

-- 19. Useful indexes
CREATE INDEX idx_leads_user ON public.leads (user_id);
CREATE INDEX idx_leads_stage ON public.leads (stage_id);
CREATE INDEX idx_bookings_user ON public.bookings (user_id);
CREATE INDEX idx_bookings_datetime ON public.bookings (start_datetime);
CREATE INDEX idx_profiles_handle ON public.profiles (handle);
