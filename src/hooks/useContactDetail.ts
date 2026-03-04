import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ContactActivity {
  id: string;
  activity_type: string;
  title: string;
  description: string | null;
  related_id: string | null;
  created_at: string;
}

export interface ContactTask {
  id: string;
  title: string;
  due_date: string | null;
  priority: string;
  completed: boolean;
}

export interface ContactBooking {
  id: string;
  customer_name: string;
  start_datetime: string;
  end_datetime: string;
  status: string;
  service_id: string | null;
  notes: string | null;
}

export function useContact(id: string | undefined) {
  return useQuery({
    queryKey: ["contact", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*, pipeline_stages(name)")
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
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as ContactActivity[];
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
        .order("completed", { ascending: true })
        .order("due_date", { ascending: true })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as ContactTask[];
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
        .select("*")
        .eq("lead_id", leadId!)
        .order("start_datetime", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as ContactBooking[];
    },
  });
}
