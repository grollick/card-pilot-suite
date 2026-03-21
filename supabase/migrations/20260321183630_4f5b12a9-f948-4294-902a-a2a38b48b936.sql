
-- Developer profiles for marketplace revenue share
CREATE TABLE public.app_developer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text NOT NULL DEFAULT '',
  contact_email text NOT NULL DEFAULT '',
  stripe_connect_id text,
  stripe_onboarded boolean NOT NULL DEFAULT false,
  commission_rate numeric NOT NULL DEFAULT 0.20,
  total_revenue numeric NOT NULL DEFAULT 0,
  total_payouts numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- App purchases / transactions
CREATE TABLE public.app_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id uuid NOT NULL REFERENCES public.marketplace_apps(id) ON DELETE CASCADE,
  developer_id uuid REFERENCES public.app_developer_profiles(id),
  amount_cents integer NOT NULL DEFAULT 0,
  platform_fee_cents integer NOT NULL DEFAULT 0,
  developer_payout_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'usd',
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  status text NOT NULL DEFAULT 'pending',
  purchase_type text NOT NULL DEFAULT 'one_time',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add developer_id column to marketplace_apps
ALTER TABLE public.marketplace_apps ADD COLUMN IF NOT EXISTS developer_profile_id uuid REFERENCES public.app_developer_profiles(id);

-- RLS
ALTER TABLE public.app_developer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_purchases ENABLE ROW LEVEL SECURITY;

-- Developer profiles: users can read/update their own
CREATE POLICY "Users can view own developer profile"
  ON public.app_developer_profiles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own developer profile"
  ON public.app_developer_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create own developer profile"
  ON public.app_developer_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Purchases: users see their own purchases
CREATE POLICY "Users can view own purchases"
  ON public.app_purchases FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- Developers see purchases of their apps
CREATE POLICY "Developers can view their app purchases"
  ON public.app_purchases FOR SELECT
  TO authenticated USING (
    developer_id IN (
      SELECT id FROM public.app_developer_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage purchases"
  ON public.app_purchases FOR ALL
  TO service_role USING (true) WITH CHECK (true);
