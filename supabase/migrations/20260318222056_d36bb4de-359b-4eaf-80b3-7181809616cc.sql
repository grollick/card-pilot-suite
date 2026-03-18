-- Client profiles table for portal authentication
CREATE TABLE public.client_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  phone text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(email)
);

ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;

-- Clients can read/update their own profile
CREATE POLICY "Clients manage own profile" ON public.client_profiles
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_client_profiles_updated_at
  BEFORE UPDATE ON public.client_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create client profile on signup if the user has 'client' role
-- We'll handle this in the edge function instead for flexibility

-- Allow clients to read leads that match their email (cross-business)
CREATE POLICY "Clients can view own lead records" ON public.leads
  FOR SELECT TO authenticated
  USING (
    email = (SELECT email FROM public.client_profiles WHERE user_id = auth.uid())
  );

-- Allow clients to view their own bookings (matched via lead_id)
CREATE POLICY "Clients can view own bookings" ON public.bookings
  FOR SELECT TO authenticated
  USING (
    lead_id IN (
      SELECT id FROM public.leads
      WHERE email = (SELECT email FROM public.client_profiles WHERE user_id = auth.uid())
    )
  );

-- Allow clients to update their own bookings (reschedule/cancel)
CREATE POLICY "Clients can update own bookings" ON public.bookings
  FOR UPDATE TO authenticated
  USING (
    lead_id IN (
      SELECT id FROM public.leads
      WHERE email = (SELECT email FROM public.client_profiles WHERE user_id = auth.uid())
    )
  );

-- Clients can view booking services for businesses they're linked to
CREATE POLICY "Clients can view linked business services" ON public.booking_services
  FOR SELECT TO authenticated
  USING (
    user_id IN (
      SELECT l.user_id FROM public.leads l
      WHERE l.email = (SELECT email FROM public.client_profiles WHERE user_id = auth.uid())
    )
    AND active = true
  );

-- Clients can view availability for businesses they're linked to
CREATE POLICY "Clients can view linked business availability" ON public.availability_rules
  FOR SELECT TO authenticated
  USING (
    user_id IN (
      SELECT l.user_id FROM public.leads l
      WHERE l.email = (SELECT email FROM public.client_profiles WHERE user_id = auth.uid())
    )
  );

-- Clients can view profiles of businesses they're linked to
CREATE POLICY "Clients can view linked business profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT l.user_id FROM public.leads l
      WHERE l.email = (SELECT email FROM public.client_profiles WHERE user_id = auth.uid())
    )
  );

-- Add 'client' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client';