CREATE OR REPLACE FUNCTION public.schedule_captured_lead_followups()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE owner_profile public.profiles%ROWTYPE; contact public.leads%ROWTYPE;
BEGIN
  IF NEW.activity_type NOT IN ('form_submitted', 'quote_requested', 'card_scanned', 'booking_created') THEN RETURN NEW; END IF;
  SELECT * INTO owner_profile FROM public.profiles WHERE id = NEW.user_id;
  SELECT * INTO contact FROM public.leads WHERE id = NEW.lead_id AND user_id = NEW.user_id;
  IF contact.id IS NULL THEN RETURN NEW; END IF;
  IF owner_profile.followup_enabled AND NULLIF(contact.email, '') IS NOT NULL THEN
    INSERT INTO public.scheduled_followups (user_id, lead_id, trigger_type, recipient_name, recipient_email, send_at, step_id, step_number)
    SELECT NEW.user_id, NEW.lead_id, 'form_submit', contact.name, contact.email,
      now() + make_interval(mins => s.delay_minutes), s.id, s.step_number
    FROM public.followup_steps s WHERE s.user_id = NEW.user_id AND s.enabled
    AND NOT EXISTS (SELECT 1 FROM public.scheduled_followups f WHERE f.lead_id = NEW.lead_id AND f.status = 'pending');
    IF NOT EXISTS (SELECT 1 FROM public.followup_steps WHERE user_id = NEW.user_id AND enabled)
       AND NOT EXISTS (SELECT 1 FROM public.scheduled_followups WHERE lead_id = NEW.lead_id AND status = 'pending') THEN
      INSERT INTO public.scheduled_followups (user_id, lead_id, trigger_type, recipient_name, recipient_email, send_at, step_number)
      VALUES (NEW.user_id, NEW.lead_id, 'form_submit', contact.name, contact.email,
        now() + make_interval(mins => COALESCE(owner_profile.followup_delay_minutes, 120)), 1);
    END IF;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Optional lead follow-up failed for %: %', NEW.lead_id, SQLERRM;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.schedule_captured_lead_followups() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER trg_captured_lead_followups AFTER INSERT ON public.contact_activities
FOR EACH ROW EXECUTE FUNCTION public.schedule_captured_lead_followups();
CREATE OR REPLACE FUNCTION public.default_new_account_booking_hours()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.user_id AND created_at >= '2026-11-11T23:34:44Z'::timestamptz)
     AND NOT EXISTS (SELECT 1 FROM public.availability_rules WHERE user_id = NEW.user_id) THEN
    INSERT INTO public.availability_rules (user_id, day_of_week, start_time, end_time)
    SELECT NEW.user_id, day, '09:00'::time, '17:00'::time FROM generate_series(0, 4) day;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.default_new_account_booking_hours() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER trg_default_new_account_booking_hours AFTER INSERT ON public.booking_services
FOR EACH ROW EXECUTE FUNCTION public.default_new_account_booking_hours();