import { useMutation, useQueryClient } from "@tanstack/react-query";
import { runAutomation } from "@/hooks/useAutomation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useLogActivity() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (activity: {
      lead_id: string;
      activity_type: string;
      title: string;
      description?: string;
      related_id?: string;
      meta_json?: Record<string, unknown>;
    }) => {
      const { error } = await supabase.from("contact_activities").insert({
        lead_id: activity.lead_id,
        activity_type: activity.activity_type,
        title: activity.title,
        description: activity.description,
        related_id: activity.related_id,
        user_id: user!.id,
        created_by_user_id: user!.id,
        occurred_at: new Date().toISOString(),
      });
      if (error) throw error;

      // Auto-cancel pending followups when a reply is logged
      if (activity.activity_type === "email_replied") {
        const now = new Date().toISOString();

        // Mark pending followups as cancelled
        await supabase
          .from("scheduled_followups")
          .update({ status: "cancelled" })
          .eq("lead_id", activity.lead_id)
          .eq("user_id", user!.id)
          .eq("status", "pending");

        // Set replied_at on sent followups that haven't been marked yet
        await supabase
          .from("scheduled_followups")
          .update({ replied_at: now })
          .eq("lead_id", activity.lead_id)
          .eq("user_id", user!.id)
          .eq("status", "sent")
          .is("replied_at", null);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contact-activities"] });
      qc.invalidateQueries({ queryKey: ["contact-followups"] });
      qc.invalidateQueries({ queryKey: ["contact-followup-history"] });
      qc.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (contact: {
      name: string;
      email?: string;
      phone?: string;
      company?: string;
      source?: "card_form" | "booking" | "manual" | "import" | "referral" | "other";
      stage_id?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from("leads")
        .insert({ ...contact, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;

      // Run new_lead automation
      await runAutomation(user!.id, "new_lead", {
        contactId: data.id,
        contactName: data.name,
      });

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string;
      stage_id?: string;
      status?: string;
      notes?: string;
      company?: string;
      name?: string;
      email?: string;
      phone?: string;
    }) => {
      const { error } = await supabase
        .from("leads")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      qc.invalidateQueries({ queryKey: ["contact"] });
    },
  });
}
