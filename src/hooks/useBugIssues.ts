import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type PriorityLevel = "critical" | "high" | "medium" | "low";
export type RoadmapStatus = "backlog" | "next_up" | "in_progress" | "done";

export interface BugIssue {
  id: string;
  title: string;
  description: string | null;
  feature_tag: string | null;
  impact_score: number;
  frequency_score: number;
  revenue_risk_score: number;
  priority_score: number;
  priority_level: PriorityLevel;
  report_count: number;
  roadmap_status: RoadmapStatus;
  feedback_ids: string[];
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

const FEATURE_IMPORTANCE: Record<string, number> = {
  invoices: 5, estimates: 4, crm: 4, bookings: 3,
  pipeline: 3, "card-builder": 2, "social-marketing": 2,
  analytics: 2, settings: 1, general: 1, customers: 3,
};

export function autoAdjustScores(issue: Partial<BugIssue>): { frequency_score: number; revenue_risk_score: number } {
  let freq = issue.frequency_score ?? 1;
  const reports = issue.report_count ?? 1;
  if (reports >= 20) freq = 5;
  else if (reports >= 10) freq = Math.max(freq, 4);
  else if (reports >= 5) freq = Math.max(freq, 3);
  else if (reports >= 3) freq = Math.max(freq, 2);

  let rev = issue.revenue_risk_score ?? 1;
  const importance = FEATURE_IMPORTANCE[issue.feature_tag ?? "general"] ?? 1;
  rev = Math.max(rev, importance);

  return { frequency_score: freq, revenue_risk_score: rev };
}

export function useBugIssues() {
  return useQuery<BugIssue[]>({
    queryKey: ["bug-issues"],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("bug_issues")
        .select("*")
        .order("priority_score", { ascending: false });
      if (error) throw error;
      return data as BugIssue[];
    },
  });
}

export function useCreateBugIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      title: string;
      description?: string;
      feature_tag?: string;
      impact_score: number;
      frequency_score: number;
      revenue_risk_score: number;
      feedback_ids?: string[];
    }) => {
      const { error } = await (supabase.from as any)("bug_issues").insert({
        title: params.title,
        description: params.description ?? null,
        feature_tag: params.feature_tag ?? null,
        impact_score: params.impact_score,
        frequency_score: params.frequency_score,
        revenue_risk_score: params.revenue_risk_score,
        feedback_ids: params.feedback_ids ?? [],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bug-issues"] });
      toast.success("Issue created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateBugIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: string;
      title?: string;
      description?: string;
      feature_tag?: string;
      impact_score?: number;
      frequency_score?: number;
      revenue_risk_score?: number;
      roadmap_status?: RoadmapStatus;
      report_count?: number;
      feedback_ids?: string[];
      resolved_at?: string | null;
    }) => {
      const { id, ...updates } = params;
      const { error } = await (supabase.from as any)("bug_issues").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bug-issues"] });
      toast.success("Issue updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteBugIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from as any)("bug_issues").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bug-issues"] });
      toast.success("Issue deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
