
-- ============================================
-- STEP 1: Enable RLS (idempotent)
-- ============================================
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.booking_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contact_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reviews ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: Add missing ownership policies (skip if exists)
-- ============================================

-- profiles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'users_manage_own_profiles') THEN
    CREATE POLICY "users_manage_own_profiles" ON public.profiles FOR ALL TO authenticated
      USING (id = auth.uid()) WITH CHECK (id = auth.uid());
  END IF;
END $$;

-- tasks
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'users_manage_own_tasks') THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasks') THEN
      CREATE POLICY "users_manage_own_tasks" ON public.tasks FOR ALL TO authenticated
        USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
    END IF;
  END IF;
END $$;

-- projects
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'users_manage_own_projects') THEN
    CREATE POLICY "users_manage_own_projects" ON public.projects FOR ALL TO authenticated
      USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- promotions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'promotions' AND policyname = 'users_manage_own_promotions') THEN
    CREATE POLICY "users_manage_own_promotions" ON public.promotions FOR ALL TO authenticated
      USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- referrals (uses referrer_id, not user_id)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referrals' AND policyname = 'users_manage_own_referrals') THEN
    CREATE POLICY "users_manage_own_referrals" ON public.referrals FOR ALL TO authenticated
      USING (referrer_id = auth.uid()) WITH CHECK (referrer_id = auth.uid());
  END IF;
END $$;

-- reviews
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'users_manage_own_reviews') THEN
    CREATE POLICY "users_manage_own_reviews" ON public.reviews FOR ALL TO authenticated
      USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ============================================
-- STEP 3: Public project viewing for anon
-- ============================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'public_view_public_projects') THEN
    CREATE POLICY "public_view_public_projects" ON public.projects FOR SELECT TO anon
      USING (is_public = true);
  END IF;
END $$;

-- Public review viewing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'public_view_public_reviews') THEN
    CREATE POLICY "public_view_public_reviews" ON public.reviews FOR SELECT TO anon
      USING (is_public = true);
  END IF;
END $$;

-- ============================================
-- STEP 6: Performance indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads (user_id);
CREATE INDEX IF NOT EXISTS idx_booking_services_user_id ON public.booking_services (user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings (user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects (user_id);
CREATE INDEX IF NOT EXISTS idx_contact_activities_user_id ON public.contact_activities (user_id);
