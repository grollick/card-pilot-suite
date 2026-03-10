
-- Recurring plan status enum
CREATE TYPE public.recurring_plan_status AS ENUM ('active', 'paused', 'cancelled', 'completed');

-- Recurring plan frequency enum
CREATE TYPE public.recurring_frequency AS ENUM ('weekly', 'biweekly', 'monthly', 'quarterly', 'custom');

-- Billing cycle enum
CREATE TYPE public.recurring_billing_cycle AS ENUM ('per_visit', 'monthly', 'custom');

-- Recurring plans table
CREATE TABLE public.recurring_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.organizations(id),
  lead_id UUID REFERENCES public.leads(id),
  job_id UUID REFERENCES public.jobs(id),
  service_name TEXT NOT NULL,
  frequency public.recurring_frequency NOT NULL DEFAULT 'monthly',
  custom_interval_days INTEGER,
  preferred_day_of_week INTEGER,
  preferred_time TIME,
  billing_cycle public.recurring_billing_cycle NOT NULL DEFAULT 'per_visit',
  price NUMERIC NOT NULL DEFAULT 0,
  status public.recurring_plan_status NOT NULL DEFAULT 'active',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  next_service_date DATE,
  last_completed_at TIMESTAMPTZ,
  visits_completed INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  skip_next BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recurring_plans ENABLE ROW LEVEL SECURITY;

-- RLS policy
CREATE POLICY "Users manage own recurring plans" ON public.recurring_plans FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER set_recurring_plans_updated_at BEFORE UPDATE ON public.recurring_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_recurring_plans_user_id ON public.recurring_plans(user_id);
CREATE INDEX idx_recurring_plans_lead_id ON public.recurring_plans(lead_id);
CREATE INDEX idx_recurring_plans_status ON public.recurring_plans(status);
CREATE INDEX idx_recurring_plans_next_service ON public.recurring_plans(next_service_date);
