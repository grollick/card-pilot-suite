
-- Job status enum
CREATE TYPE public.job_status AS ENUM ('draft', 'scheduled', 'in_progress', 'paused', 'completed', 'cancelled');

-- Jobs table
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  estimate_id uuid REFERENCES public.estimates(id) ON DELETE SET NULL,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  job_number text NOT NULL,
  title text NOT NULL,
  job_address text,
  job_type text,
  status public.job_status NOT NULL DEFAULT 'draft',
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  actual_start timestamptz,
  actual_end timestamptz,
  notes text,
  internal_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own jobs" ON public.jobs
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_jobs_user_id ON public.jobs(user_id);
CREATE INDEX idx_jobs_lead_id ON public.jobs(lead_id);
CREATE INDEX idx_jobs_status ON public.jobs(status);

-- Job tasks
CREATE TABLE public.job_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  title text NOT NULL,
  assigned_to_user_id uuid,
  status text NOT NULL DEFAULT 'not_started',
  due_date date,
  notes text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.job_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own job tasks" ON public.job_tasks
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = job_tasks.job_id AND jobs.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = job_tasks.job_id AND jobs.user_id = auth.uid()));

CREATE INDEX idx_job_tasks_job_id ON public.job_tasks(job_id);

-- Job photos
CREATE TABLE public.job_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  photo_url text NOT NULL,
  category text NOT NULL DEFAULT 'during',
  caption text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.job_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own job photos" ON public.job_photos
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_job_photos_job_id ON public.job_photos(job_id);

-- Job materials
CREATE TABLE public.job_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_cost numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.job_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own job materials" ON public.job_materials
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = job_materials.job_id AND jobs.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = job_materials.job_id AND jobs.user_id = auth.uid()));

CREATE INDEX idx_job_materials_job_id ON public.job_materials(job_id);

-- Updated_at trigger for jobs
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
