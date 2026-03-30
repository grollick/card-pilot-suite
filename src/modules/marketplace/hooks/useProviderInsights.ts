import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AISuggestion {
  type: "lead_reply" | "follow_up" | "review_request" | "profile_improve" | "booking_confirm";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  leadId?: string;
  bookingId?: string;
}

export interface LeadReplyResult {
  reply: string;
  summary: string;
  missingInfo: string[];
  suggestedAction: string;
}

export interface FollowUpResult {
  message: string;
  subject: string;
}

export interface BookingConfirmResult {
  confirmation: string;
  reminder: string;
}

export interface ReviewRequestResult {
  message: string;
}

export interface ProfileSuggestion {
  field: string;
  suggestion: string;
  reason: string;
  priority: "high" | "medium" | "low";
}

async function callInsights(action: string, context?: any) {
  const { data, error } = await supabase.functions.invoke("provider-insights", {
    body: { action, context },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data?.result;
}

export function useProviderInsights() {
  const { user } = useAuth();
  return useQuery<AISuggestion[]>({
    queryKey: ["provider-insights", user?.id],
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
    retry: 1,
    queryFn: async () => {
      const result = await callInsights("insights");
      return Array.isArray(result) ? result : [];
    },
  });
}

export function useLeadReply() {
  return useMutation<LeadReplyResult, Error, any>({
    mutationFn: async (lead: any) => {
      return await callInsights("lead_reply", { lead });
    },
  });
}

export function useFollowUp() {
  return useMutation<FollowUpResult, Error, any>({
    mutationFn: async (lead: any) => {
      return await callInsights("follow_up", { lead });
    },
  });
}

export function useBookingConfirm() {
  return useMutation<BookingConfirmResult, Error, any>({
    mutationFn: async (booking: any) => {
      return await callInsights("booking_confirm", { booking });
    },
  });
}

export function useReviewRequest() {
  return useMutation<ReviewRequestResult, Error, any>({
    mutationFn: async (booking: any) => {
      return await callInsights("review_request", { booking });
    },
  });
}

export function useProfileOptimize() {
  return useQuery<ProfileSuggestion[]>({
    queryKey: ["provider-profile-optimize"],
    staleTime: 1000 * 60 * 15,
    retry: 1,
    queryFn: async () => {
      const result = await callInsights("profile_optimize");
      return Array.isArray(result) ? result : [];
    },
  });
}
