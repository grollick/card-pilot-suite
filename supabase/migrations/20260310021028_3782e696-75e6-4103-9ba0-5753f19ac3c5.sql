
-- Social campaigns table
CREATE TABLE public.social_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid REFERENCES public.organizations(id),
  name text NOT NULL,
  description text,
  color text DEFAULT '#6366f1',
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.social_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own social campaigns"
  ON public.social_campaigns FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Social queue slots table
CREATE TABLE public.social_queue_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  account_id uuid REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  platform text NOT NULL,
  day_of_week integer NOT NULL,
  time_slot time NOT NULL,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.social_queue_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own queue slots"
  ON public.social_queue_slots FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add new columns to social_posts
ALTER TABLE public.social_posts
  ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES public.social_campaigns(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS content_label text,
  ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS platform_overrides jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS queue_position integer;

-- Add metadata columns to social_accounts
ALTER TABLE public.social_accounts
  ADD COLUMN IF NOT EXISTS platform_avatar_url text,
  ADD COLUMN IF NOT EXISTS platform_username text;

-- Add updated_at trigger for social_campaigns
CREATE TRIGGER update_social_campaigns_updated_at
  BEFORE UPDATE ON public.social_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
