
-- Team Cards: allow each org member to have their own card
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS team_member_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS is_team_card boolean NOT NULL DEFAULT false;

-- Expenses table for job cost tracking
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  category text NOT NULL DEFAULT 'materials',
  description text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  receipt_url text,
  vendor text,
  is_billable boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own expenses"
  ON public.expenses FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Google Business sync settings
CREATE TABLE public.google_business_sync (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  place_id text,
  business_name text,
  last_synced_at timestamptz,
  sync_reviews boolean NOT NULL DEFAULT true,
  sync_photos boolean NOT NULL DEFAULT false,
  sync_info boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'disconnected',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.google_business_sync ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own google sync"
  ON public.google_business_sync FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
