
-- ============================================
-- 1. CREATE daily_metrics table (the only missing table)
-- ============================================
CREATE TABLE public.daily_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid REFERENCES public.organizations(id),
  metric_date date NOT NULL DEFAULT CURRENT_DATE,
  card_views integer NOT NULL DEFAULT 0,
  leads_count integer NOT NULL DEFAULT 0,
  bookings_count integer NOT NULL DEFAULT 0,
  revenue numeric NOT NULL DEFAULT 0,
  estimates_sent integer NOT NULL DEFAULT 0,
  jobs_completed integer NOT NULL DEFAULT 0,
  referrals_count integer NOT NULL DEFAULT 0,
  qr_scans integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, metric_date)
);

-- RLS
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own daily metrics"
  ON public.daily_metrics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own daily metrics"
  ON public.daily_metrics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own daily metrics"
  ON public.daily_metrics FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for daily_metrics
CREATE INDEX idx_daily_metrics_user_date ON public.daily_metrics (user_id, metric_date DESC);
CREATE INDEX idx_daily_metrics_org_id ON public.daily_metrics (org_id) WHERE org_id IS NOT NULL;

-- updated_at trigger
CREATE TRIGGER update_daily_metrics_updated_at
  BEFORE UPDATE ON public.daily_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. ADD missing indexes on existing tables
-- ============================================

-- promotions: index on user_id for RLS and queries
CREATE INDEX IF NOT EXISTS idx_promotions_user_id ON public.promotions (user_id);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON public.promotions (active) WHERE active = true;

-- referrals: index on referrer_id and referral_code
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals (referrer_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals (referral_code);

-- campaigns: index on user_id
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON public.campaigns (user_id);

-- email_templates: index on user_id
CREATE INDEX IF NOT EXISTS idx_email_templates_user_id ON public.email_templates (user_id);

-- profiles: index on referred_by for referral queries
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles (referred_by) WHERE referred_by IS NOT NULL;

-- reviews: index on lead_id
CREATE INDEX IF NOT EXISTS idx_reviews_lead_id ON public.reviews (lead_id) WHERE lead_id IS NOT NULL;

-- projects: index on is_public for public gallery queries
CREATE INDEX IF NOT EXISTS idx_projects_public ON public.projects (is_public) WHERE is_public = true;
