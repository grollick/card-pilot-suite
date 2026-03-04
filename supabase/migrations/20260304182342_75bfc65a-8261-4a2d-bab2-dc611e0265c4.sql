
-- Organization role enum
CREATE TYPE public.org_role AS ENUM ('owner', 'admin', 'member');

-- Organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Organization members table
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role org_role NOT NULL DEFAULT 'member',
  invited_by UUID,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id)
);

-- Add org_id to profiles (current/active org)
ALTER TABLE public.profiles ADD COLUMN current_org_id UUID REFERENCES public.organizations(id);

-- Security definer functions
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organization_members WHERE user_id = _user_id AND org_id = _org_id)
$$;

CREATE OR REPLACE FUNCTION public.has_org_role(_user_id UUID, _org_id UUID, _role org_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organization_members WHERE user_id = _user_id AND org_id = _org_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organization_members WHERE user_id = _user_id AND org_id = _org_id AND role IN ('owner', 'admin'))
$$;

-- RLS for organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view their orgs" ON public.organizations FOR SELECT USING (public.is_org_member(auth.uid(), id));
CREATE POLICY "Admins can update their orgs" ON public.organizations FOR UPDATE USING (public.is_org_admin(auth.uid(), id));
CREATE POLICY "Authenticated users can create orgs" ON public.organizations FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Owners can delete their orgs" ON public.organizations FOR DELETE USING (public.has_org_role(auth.uid(), id, 'owner'));

-- RLS for organization_members
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view org members" ON public.organization_members FOR SELECT USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "Admins can manage org members" ON public.organization_members FOR ALL USING (public.is_org_admin(auth.uid(), org_id));
CREATE POLICY "Users can insert themselves as owner" ON public.organization_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND role = 'owner');

-- Trigger for updated_at
CREATE TRIGGER set_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add org_id to all shared tables
ALTER TABLE public.leads ADD COLUMN org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.pipeline_stages ADD COLUMN org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.booking_services ADD COLUMN org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.email_templates ADD COLUMN org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.campaigns ADD COLUMN org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.cards ADD COLUMN org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.brand_kits ADD COLUMN org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.tags ADD COLUMN org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.bookings ADD COLUMN org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.analytics_events ADD COLUMN org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.social_posts ADD COLUMN org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.social_accounts ADD COLUMN org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.automation_rules ADD COLUMN org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.availability_rules ADD COLUMN org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.tasks ADD COLUMN org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.contact_activities ADD COLUMN org_id UUID REFERENCES public.organizations(id);

-- Indexes
CREATE INDEX idx_leads_org_id ON public.leads(org_id);
CREATE INDEX idx_pipeline_stages_org_id ON public.pipeline_stages(org_id);
CREATE INDEX idx_booking_services_org_id ON public.booking_services(org_id);
CREATE INDEX idx_bookings_org_id ON public.bookings(org_id);
CREATE INDEX idx_tasks_org_id ON public.tasks(org_id);
CREATE INDEX idx_tags_org_id ON public.tags(org_id);
CREATE INDEX idx_org_members_user_id ON public.organization_members(user_id);
CREATE INDEX idx_org_members_org_id ON public.organization_members(org_id);

-- Performance indexes (Phase 11)
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage_id ON public.leads(stage_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_activities_lead_id ON public.contact_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
