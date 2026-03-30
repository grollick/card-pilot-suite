CREATE TABLE IF NOT EXISTS public.business_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  status text DEFAULT 'active',
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  billing_cycle text DEFAULT 'monthly',
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.business_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their business subscriptions"
  ON public.business_subscriptions
  FOR ALL
  TO authenticated
  USING (
    business_id IN (SELECT id FROM public.businesses WHERE owner_user_id = auth.uid())
  )
  WITH CHECK (
    business_id IN (SELECT id FROM public.businesses WHERE owner_user_id = auth.uid())
  );