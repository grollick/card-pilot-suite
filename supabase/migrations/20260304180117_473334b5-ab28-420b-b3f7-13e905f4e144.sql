-- Trigger: update last_activity_at on contact when activity logged
CREATE TRIGGER trg_update_contact_last_activity
  AFTER INSERT ON public.contact_activities
  FOR EACH ROW EXECUTE FUNCTION public.update_contact_last_activity();

-- Trigger: update next_activity_at on contact when task changes
CREATE TRIGGER trg_update_contact_next_activity_insert
  AFTER INSERT ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_contact_next_activity();

CREATE TRIGGER trg_update_contact_next_activity_update
  AFTER UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_contact_next_activity();

-- Trigger: updated_at auto-update on key tables
CREATE TRIGGER trg_leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_cards_updated_at BEFORE UPDATE ON public.cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_booking_services_updated_at BEFORE UPDATE ON public.booking_services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_email_templates_updated_at BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();