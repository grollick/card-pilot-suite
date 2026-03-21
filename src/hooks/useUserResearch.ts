import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ───
export type CandidateGroup = "newly_activated" | "dropped_off" | "highly_engaged" | "beta_tester" | "first_lead" | "not_activated";
export type InterviewStatus = "new" | "in_progress" | "completed" | "cancelled";
export type FollowUpStatus = "none" | "follow_up_later" | "invite_to_test" | "testimonial_candidate" | "case_study_candidate";
export type InsightCategory = "onboarding" | "card_editor" | "marketplace" | "social" | "estimates" | "invoices" | "confusing" | "high_value" | "churn_risk";
export type ActionStatus = "new" | "reviewing" | "planned" | "fixed" | "ignored";

export const INSIGHT_CATEGORIES: InsightCategory[] = [
  "onboarding", "card_editor", "marketplace", "social", "estimates", "invoices", "confusing", "high_value", "churn_risk",
];

export const CANDIDATE_GROUPS: { value: CandidateGroup; label: string }[] = [
  { value: "newly_activated", label: "Newly Activated" },
  { value: "dropped_off", label: "Dropped Off" },
  { value: "highly_engaged", label: "Highly Engaged" },
  { value: "beta_tester", label: "Beta Tester" },
  { value: "first_lead", label: "First Lead" },
  { value: "not_activated", label: "Not Activated" },
];

export const INTERVIEW_QUESTIONS = [
  "What did you think this was when you first saw it?",
  "Was anything confusing or unclear?",
  "When did it start to feel useful to you?",
  "Was there anything that almost made you stop using it?",
  "What do you feel is missing right now?",
  "Would you actually use this in your business? Why or why not?",
  "If you could change one thing, what would it be?",
];

export interface UserInterview {
  id: string;
  user_id: string;
  interviewer_name: string;
  interview_date: string;
  status: InterviewStatus;
  candidate_reason: string | null;
  candidate_group: CandidateGroup | null;
  follow_up_status: FollowUpStatus;
  answers: Record<string, string>;
  notes: string;
  pain_points: string[];
  positive_reactions: string[];
  suggested_improvements: string[];
  created_at: string;
  updated_at: string;
  // joined
  profile_name?: string;
  profile_company?: string;
  profile_last_active?: string;
}

export interface InterviewInsight {
  id: string;
  interview_id: string;
  insight_text: string;
  category: InsightCategory;
  action_status: ActionStatus;
  created_at: string;
}

// ─── Queries ───
export function useInterviews() {
  return useQuery({
    queryKey: ["admin-interviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_interviews" as any)
        .select("*")
        .order("interview_date", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as UserInterview[];
    },
  });
}

export function useInterviewInsights() {
  return useQuery({
    queryKey: ["admin-interview-insights"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interview_insights" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as InterviewInsight[];
    },
  });
}

export function useInterviewCandidates() {
  return useQuery({
    queryKey: ["admin-interview-candidates"],
    queryFn: async () => {
      // Get profiles with useful signals for interview prioritization
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, company, created_at, updated_at, plan, verification_level")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
  });
}

// ─── Mutations ───
export function useCreateInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      user_id: string;
      candidate_group?: CandidateGroup;
      candidate_reason?: string;
      interviewer_name?: string;
    }) => {
      const { data, error } = await supabase
        .from("user_interviews" as any)
        .insert({
          user_id: input.user_id,
          candidate_group: input.candidate_group || null,
          candidate_reason: input.candidate_reason || null,
          interviewer_name: input.interviewer_name || "Admin",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-interviews"] }),
  });
}

export function useUpdateInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<UserInterview> & { id: string }) => {
      const { error } = await supabase
        .from("user_interviews" as any)
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-interviews"] }),
  });
}

export function useCreateInsight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { interview_id: string; insight_text: string; category: InsightCategory }) => {
      const { error } = await supabase
        .from("interview_insights" as any)
        .insert(input);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-interview-insights"] }),
  });
}

export function useUpdateInsightStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, action_status }: { id: string; action_status: ActionStatus }) => {
      const { error } = await supabase
        .from("interview_insights" as any)
        .update({ action_status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-interview-insights"] }),
  });
}
