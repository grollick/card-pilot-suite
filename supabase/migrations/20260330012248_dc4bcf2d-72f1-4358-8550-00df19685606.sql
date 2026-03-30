
-- Add missing columns to existing tables
ALTER TABLE public.business_bookings ADD COLUMN IF NOT EXISTS source text DEFAULT 'card';
ALTER TABLE public.business_reviews ADD COLUMN IF NOT EXISTS source text DEFAULT 'marketplace';
ALTER TABLE public.business_categories ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.service_areas ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_businesses_owner_user_id ON businesses(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);
CREATE INDEX IF NOT EXISTS idx_businesses_marketplace_visible ON businesses(is_marketplace_visible);
CREATE INDEX IF NOT EXISTS idx_business_categories_business_id ON business_categories(business_id);
CREATE INDEX IF NOT EXISTS idx_business_categories_category_key ON business_categories(category_key);
CREATE INDEX IF NOT EXISTS idx_services_business_id ON services(business_id);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_service_areas_business_id ON service_areas(business_id);
CREATE INDEX IF NOT EXISTS idx_service_areas_city ON service_areas(city);
CREATE INDEX IF NOT EXISTS idx_business_leads_business_id ON business_leads(business_id);
CREATE INDEX IF NOT EXISTS idx_business_leads_service_id ON business_leads(service_id);
CREATE INDEX IF NOT EXISTS idx_business_leads_status ON business_leads(status);
CREATE INDEX IF NOT EXISTS idx_business_leads_source ON business_leads(source);
CREATE INDEX IF NOT EXISTS idx_business_bookings_business_id ON business_bookings(business_id);
CREATE INDEX IF NOT EXISTS idx_business_bookings_service_id ON business_bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_business_bookings_lead_id ON business_bookings(lead_id);
CREATE INDEX IF NOT EXISTS idx_business_bookings_status ON business_bookings(status);
CREATE INDEX IF NOT EXISTS idx_business_bookings_date ON business_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_business_reviews_business_id ON business_reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_business_reviews_booking_id ON business_reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_business_reviews_rating ON business_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_business_reviews_approved ON business_reviews(is_approved);

-- Pipeline summary view
CREATE OR REPLACE VIEW public.business_pipeline_summary AS
SELECT
  b.id AS business_id,
  b.business_name,
  count(DISTINCT bl.id) AS total_leads,
  count(DISTINCT bb.id) AS total_bookings,
  coalesce(avg(CASE WHEN br.is_approved THEN br.rating END), 0) AS avg_rating,
  count(DISTINCT CASE WHEN br.is_approved THEN br.id END) AS total_reviews
FROM businesses b
LEFT JOIN business_leads bl ON bl.business_id = b.id
LEFT JOIN business_bookings bb ON bb.business_id = b.id
LEFT JOIN business_reviews br ON br.business_id = b.id
GROUP BY b.id, b.business_name;
