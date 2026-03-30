
-- 1. Businesses (core entity)
CREATE TABLE public.businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  business_name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  phone text,
  email text,
  website text,
  location_city text,
  location_region text,
  country text DEFAULT 'Canada',
  logo_url text,
  cover_image_url text,
  is_active boolean DEFAULT true,
  is_marketplace_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Business profiles
CREATE TABLE public.business_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid UNIQUE NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  headline text,
  subheadline text,
  bio text,
  cta_primary_text text DEFAULT 'Book Now',
  cta_secondary_text text DEFAULT 'Request Quote',
  booking_enabled boolean DEFAULT true,
  lead_form_enabled boolean DEFAULT true,
  marketplace_enabled boolean DEFAULT true,
  theme_color text,
  custom_domain text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Business categories
CREATE TABLE public.business_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  category_key text NOT NULL
);

-- 4. Services
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  price_type text DEFAULT 'quote_only',
  price_amount numeric,
  duration_minutes integer,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 5. Service areas
CREATE TABLE public.service_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  city text NOT NULL,
  region text,
  postal_code text,
  radius_km integer
);

-- 6. Business leads (prefixed to avoid conflict with existing leads table)
CREATE TABLE public.business_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text,
  phone text,
  message text,
  source text DEFAULT 'card',
  status text DEFAULT 'new',
  created_at timestamptz DEFAULT now()
);

-- 7. Business bookings (prefixed to avoid conflict with existing bookings table)
CREATE TABLE public.business_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.business_leads(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text,
  booking_date date NOT NULL,
  booking_time text,
  status text DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 8. Business reviews (prefixed to avoid conflict with existing reviews table)
CREATE TABLE public.business_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.business_bookings(id) ON DELETE SET NULL,
  reviewer_name text NOT NULL,
  rating integer NOT NULL,
  review_text text,
  is_approved boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Use a trigger instead of CHECK constraint for rating validation
CREATE OR REPLACE FUNCTION public.validate_business_review_rating()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_business_review_rating
  BEFORE INSERT OR UPDATE ON public.business_reviews
  FOR EACH ROW EXECUTE FUNCTION public.validate_business_review_rating();

-- 9. Marketplace metrics
CREATE TABLE public.marketplace_metrics (
  business_id uuid PRIMARY KEY REFERENCES public.businesses(id) ON DELETE CASCADE,
  avg_rating numeric DEFAULT 0,
  review_count integer DEFAULT 0,
  lead_count_30d integer DEFAULT 0,
  booking_count_30d integer DEFAULT 0,
  response_score numeric DEFAULT 0,
  profile_completeness_score numeric DEFAULT 0,
  marketplace_score numeric DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies: owners can manage their own business data
CREATE POLICY "Owners manage their businesses" ON public.businesses FOR ALL TO authenticated USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());
CREATE POLICY "Public can view active businesses" ON public.businesses FOR SELECT TO anon USING (is_active = true AND is_marketplace_visible = true);

CREATE POLICY "Owners manage business profiles" ON public.business_profiles FOR ALL TO authenticated USING (business_id IN (SELECT id FROM public.businesses WHERE owner_user_id = auth.uid())) WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()));
CREATE POLICY "Public can view business profiles" ON public.business_profiles FOR SELECT TO anon USING (business_id IN (SELECT id FROM public.businesses WHERE is_active = true AND is_marketplace_visible = true));

CREATE POLICY "Owners manage categories" ON public.business_categories FOR ALL TO authenticated USING (business_id IN (SELECT id FROM public.businesses WHERE owner_user_id = auth.uid())) WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()));
CREATE POLICY "Public can view categories" ON public.business_categories FOR SELECT TO anon USING (true);

CREATE POLICY "Owners manage services" ON public.services FOR ALL TO authenticated USING (business_id IN (SELECT id FROM public.businesses WHERE owner_user_id = auth.uid())) WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()));
CREATE POLICY "Public can view active services" ON public.services FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "Owners manage service areas" ON public.service_areas FOR ALL TO authenticated USING (business_id IN (SELECT id FROM public.businesses WHERE owner_user_id = auth.uid())) WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()));
CREATE POLICY "Public can view service areas" ON public.service_areas FOR SELECT TO anon USING (true);

CREATE POLICY "Owners manage business leads" ON public.business_leads FOR ALL TO authenticated USING (business_id IN (SELECT id FROM public.businesses WHERE owner_user_id = auth.uid())) WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()));
CREATE POLICY "Anyone can submit leads" ON public.business_leads FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Owners manage business bookings" ON public.business_bookings FOR ALL TO authenticated USING (business_id IN (SELECT id FROM public.businesses WHERE owner_user_id = auth.uid())) WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()));
CREATE POLICY "Anyone can create bookings" ON public.business_bookings FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Owners manage business reviews" ON public.business_reviews FOR ALL TO authenticated USING (business_id IN (SELECT id FROM public.businesses WHERE owner_user_id = auth.uid())) WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()));
CREATE POLICY "Public can view approved reviews" ON public.business_reviews FOR SELECT TO anon USING (is_approved = true);
CREATE POLICY "Anyone can submit reviews" ON public.business_reviews FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Owners view marketplace metrics" ON public.marketplace_metrics FOR ALL TO authenticated USING (business_id IN (SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()));
CREATE POLICY "Public can view marketplace metrics" ON public.marketplace_metrics FOR SELECT TO anon USING (true);
