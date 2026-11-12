ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS paypal_me_url text,
  ADD COLUMN IF NOT EXISTS stripe_payment_link text;