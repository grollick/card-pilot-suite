import { useMutation, useQueryClient } from "@tanstack/react-query";
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
    }) => {
      const { error } = await supabase.from("contact_activities").insert({
        ...activity,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contact-activities"] });
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
      source?: "card_form" | "booking" | "manual" | "import";
      stage_id?: string;
      tags?: string[];
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from("leads")
        .insert({ ...contact, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}
