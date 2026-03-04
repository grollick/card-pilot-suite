import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useTasks(filters?: { status?: string }) {
  return useQuery({
    queryKey: ["tasks", filters],
    queryFn: async () => {
      let query = supabase
        .from("tasks")
        .select("*, leads(id, name)")
        .order("due_date", { ascending: true, nullsFirst: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (task: {
      title: string;
      lead_id?: string | null;
      booking_id?: string | null;
      due_date?: string | null;
      priority?: string;
      type?: string;
      remind_at?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          ...task,
          user_id: user!.id,
          created_by_user_id: user!.id,
          assigned_to_user_id: user!.id,
          status: "open",
        })
        .select()
        .single();
      if (error) throw error;

      // Log activity on linked contact
      if (task.lead_id) {
        await supabase.from("contact_activities").insert({
          user_id: user!.id,
          lead_id: task.lead_id,
          activity_type: "task_created",
          title: `Task created: ${task.title}`,
          related_id: data.id,
          created_by_user_id: user!.id,
          occurred_at: new Date().toISOString(),
        });
      }
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["contact-tasks"] });
      qc.invalidateQueries({ queryKey: ["contact-activities"] });
      qc.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, leadId, ...updates }: {
      id: string;
      leadId?: string | null;
      status?: string;
      title?: string;
      priority?: string;
      due_date?: string | null;
      type?: string;
    }) => {
      const payload: Record<string, unknown> = { ...updates };
      if (updates.status === "done") {
        payload.completed = true;
        payload.completed_at = new Date().toISOString();
      } else if (updates.status === "open") {
        payload.completed = false;
        payload.completed_at = null;
      }

      const { error } = await supabase.from("tasks").update(payload).eq("id", id);
      if (error) throw error;

      // Log completion activity
      if (updates.status === "done" && leadId) {
        await supabase.from("contact_activities").insert({
          user_id: user!.id,
          lead_id: leadId,
          activity_type: "task_completed",
          title: `Task completed: ${updates.title ?? "Task"}`,
          related_id: id,
          created_by_user_id: user!.id,
          occurred_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["contact-tasks"] });
      qc.invalidateQueries({ queryKey: ["contact-activities"] });
      qc.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}
