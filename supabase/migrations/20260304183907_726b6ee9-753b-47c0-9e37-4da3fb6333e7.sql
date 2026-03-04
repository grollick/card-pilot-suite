
-- Performance indexes for SaaS scale
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage_id ON public.leads(stage_id);
CREATE INDEX IF NOT EXISTS idx_leads_org_id ON public.leads(org_id);
CREATE INDEX IF NOT EXISTS idx_leads_updated_at ON public.leads(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_lead_id ON public.tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date) WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_contact_activities_lead_id ON public.contact_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_contact_activities_user_id ON public.contact_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_activities_occurred ON public.contact_activities(occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_lead_id ON public.bookings(lead_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(user_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_start ON public.bookings(start_datetime);

CREATE INDEX IF NOT EXISTS idx_analytics_events_handle ON public.analytics_events(handle);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON public.analytics_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cards_user_id ON public.cards(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_handle ON public.profiles(handle) WHERE handle IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_campaign_emails_campaign ON public.campaign_emails(campaign_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_user_trigger ON public.automation_rules(user_id, trigger_type) WHERE enabled = true;
