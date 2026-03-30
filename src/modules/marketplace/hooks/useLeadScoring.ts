import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface LeadScore {
  id: string;
  lead_id: string;
  business_id: string;
  score: number;
  label: "High Intent" | "Medium Intent" | "Low Intent";
  explanation: string | null;
  recommended_action: string | null;
  scoring_factors: {
    completeness?: number;
    urgency?: number;
    service_match?: number;
    recency?: number;
    contact_quality?: number;
  };
  created_at: string;
  updated_at: string;
  business_leads?: {
    full_name: string;
    email: string | null;
    phone: string | null;
    message: string | null;
    status: string | null;
    source: string | null;
    created_at: string;
  };
}

async function callInsights(action: string, context?: any) {
  const { data, error } = await supabase.functions.invoke("provider-insights", {
    body: { action, context },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data?.result;
}

/** Get all lead scores for current business */
export function useLeadScores() {
  const { user } = useAuth();
  return useQuery<LeadScore[]>({
    queryKey: ["lead-scores", user?.id],
    enabled: !!user,
    staleTime: 1000 * 60 * 3,
    queryFn: async () => {
      const result = await callInsights("get_lead_scores");
      return Array.isArray(result) ? result : [];
    },
  });
}

/** Get a single lead's score */
export function useLeadScore(leadId?: string) {
  const { user } = useAuth();
  return useQuery<LeadScore | null>({
    queryKey: ["lead-score", leadId],
    enabled: !!user && !!leadId,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const result = await callInsights("get_lead_score", { leadId });
      return result || null;
    },
  });
}

/** Score or re-score a lead */
export function useScoreLead() {
  const qc = useQueryClient();
  return useMutation<any, Error, { lead_id: string }>({
    mutationFn: async ({ lead_id }) => {
      return await callInsights("score_lead", { lead: { lead_id } });
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["lead-scores"] });
      qc.invalidateQueries({ queryKey: ["lead-score", vars.lead_id] });
    },
  });
}

/** Get high-intent leads needing reply */
export function useHighIntentLeads() {
  const { data: scores, isLoading } = useLeadScores();
  const highIntent = (scores || []).filter(
    (s) => s.score >= 80 && s.business_leads?.status !== "contacted" && s.business_leads?.status !== "booked"
  );
  return { data: highIntent, isLoading };
}
