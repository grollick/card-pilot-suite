import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LeadScore {
  lead_id: string;
  score: number;
  tier: "hot" | "warm" | "cold";
  reason: string;
  suggested_action?: string;
}

export function useAILeadScores(leadIds: string[]) {
  return useQuery<LeadScore[]>({
    queryKey: ["ai-lead-scores", leadIds.sort().join(",")],
    enabled: leadIds.length > 0,
    staleTime: 1000 * 60 * 10,
    retry: 1,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("ai-lead-score", {
        body: { lead_ids: leadIds.slice(0, 20) },
      });
      if (error) throw error;
      return (data?.scores ?? []) as LeadScore[];
    },
  });
}

export function useAIReplyDraft(leadId: string | null) {
  return useQuery({
    queryKey: ["ai-reply-draft", leadId],
    enabled: !!leadId,
    staleTime: 1000 * 60 * 5,
    retry: 1,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("ai-reply-draft", {
        body: { lead_id: leadId },
      });
      if (error) throw error;
      return data as { draft: string; subject?: string; tone?: string; follow_up_suggestion?: string };
    },
  });
}

export function useAICardOptimizer() {
  return useQuery({
    queryKey: ["ai-card-optimizer"],
    staleTime: 1000 * 60 * 15,
    retry: 1,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("ai-card-optimizer");
      if (error) throw error;
      return data as {
        overall_score: number;
        suggestions: Array<{
          title: string;
          description: string;
          priority: "high" | "medium" | "low";
          section: string;
          impact: string;
        }>;
      };
    },
  });
}
