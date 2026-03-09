import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useContact(id: string | undefined) {
  return useQuery({
    queryKey: ["contact", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*, pipeline_stages(id, name, is_won, is_lost), contact_tags(tag_id, tags(id, name, color))")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useContactActivities(leadId: string | undefined) {
  return useQuery({
    queryKey: ["contact-activities", leadId],
    enabled: !!leadId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_activities")
        .select("*")
        .eq("lead_id", leadId!)
        .order("occurred_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useContactTasks(leadId: string | undefined) {
  return useQuery({
    queryKey: ["contact-tasks", leadId],
    enabled: !!leadId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("lead_id", leadId!)
        .order("status", { ascending: true })
        .order("due_date", { ascending: true })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useContactBookings(leadId: string | undefined) {
  return useQuery({
    queryKey: ["contact-bookings", leadId],
    enabled: !!leadId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, booking_services(name)")
        .eq("lead_id", leadId!)
        .order("start_datetime", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useContactFollowups(leadId: string | undefined) {
  return useQuery({
    queryKey: ["contact-followups", leadId],
    enabled: !!leadId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_followups")
        .select("*, followup_variants(variant_key, subject)")
        .eq("lead_id", leadId!)
        .eq("status", "pending")
        .order("send_at", { ascending: true })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useContactFollowupHistory(leadId: string | undefined) {
  return useQuery({
    queryKey: ["contact-followup-history", leadId],
    enabled: !!leadId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_followups")
        .select("*, followup_variants(variant_key, subject)")
        .eq("lead_id", leadId!)
        .order("send_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}
