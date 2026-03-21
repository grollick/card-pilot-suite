import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface FirstLeadGuarantee {
  id: string;
  user_id: string;
  activated_at: string;
  deadline_at: string;
  status: "monitoring" | "matched" | "test_delivered" | "responded" | "expired";
  first_lead_at: string | null;
  first_response_at: string | null;
  test_lead_id: string | null;
  matched_request_id: string | null;
}

export function useFirstLeadGuarantee() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["first-lead-guarantee", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("first_lead_guarantee")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as FirstLeadGuarantee | null;
    },
  });
}

export function useMarkGuaranteeResponded() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      // We can't update directly due to RLS (SELECT only), so use an edge function
      // For now, just invalidate — the edge function will detect response via leads table
      await supabase.functions.invoke("first-lead-guarantee");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["first-lead-guarantee", user?.id] });
    },
  });
}
