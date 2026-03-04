
-- QR Campaigns table
CREATE TABLE public.qr_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  description text,
  placement text NOT NULL DEFAULT 'other',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- QR Scans table
CREATE TABLE public.qr_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.qr_campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  handle text NOT NULL,
  device text,
  referrer text,
  user_agent text,
  ip_hash text,
  meta_json jsonb DEFAULT '{}'::jsonb,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_qr_campaigns_user ON public.qr_campaigns(user_id);
CREATE INDEX idx_qr_campaigns_code ON public.qr_campaigns(code);
CREATE INDEX idx_qr_scans_campaign ON public.qr_scans(campaign_id);
CREATE INDEX idx_qr_scans_created ON public.qr_scans(created_at);

-- RLS
ALTER TABLE public.qr_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_scans ENABLE ROW LEVEL SECURITY;

-- Campaigns: users manage own
CREATE POLICY "Users manage own QR campaigns"
  ON public.qr_campaigns FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- Scans: public insert (for the redirect function), users read own
CREATE POLICY "Public can insert QR scans"
  ON public.qr_scans FOR INSERT
  WITH CHECK (campaign_id IS NOT NULL AND handle IS NOT NULL);

CREATE POLICY "Users view own QR scans"
  ON public.qr_scans FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER update_qr_campaigns_updated_at
  BEFORE UPDATE ON public.qr_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
