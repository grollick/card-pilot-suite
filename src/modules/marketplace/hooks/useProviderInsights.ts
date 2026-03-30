import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AIUsageData {
  used: number;
  limit: number;
  plan: string;
  features: {
    follow_up: boolean;
    profile_rewrite: boolean;
    advanced_growth: boolean;
  };
}

export interface AIErrorResponse {
  error: "ai_limit_reached" | "feature_locked";
  used?: number;
  limit?: number;
  plan?: string;
  feature?: string;
  required_plan?: string;
}

export interface AISuggestion {
  type: "lead_reply" | "follow_up" | "review_request" | "profile_improve" | "booking_confirm";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  leadId?: string;
  bookingId?: string;
}

export interface SavedSuggestion {
  id: string;
  business_id: string;
  suggestion_type: string;
  title: string;
  description: string;
  priority: string;
  status: "active" | "used" | "dismissed";
  lead_id: string | null;
  booking_id: string | null;
  ai_response: any;
  created_at: string;
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

/** Get the current user's business */
export function useProviderBusiness() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["provider-business", user?.id],
    enabled: !!user,
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      const { data } = await supabase
        .from("businesses")
        .select("id, business_name, slug, location_city")
        .eq("owner_user_id", user!.id)
        .eq("is_active", true)
        .maybeSingle();
      return data;
    },
  });
}

/** AI-generated insights (calls edge function) */
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

/** Get saved suggestions from database */
export function useSavedSuggestions() {
  const { user } = useAuth();
  return useQuery<SavedSuggestion[]>({
    queryKey: ["saved-suggestions", user?.id],
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
    queryFn: async () => {
      const result = await callInsights("get_suggestions");
      return Array.isArray(result) ? result : [];
    },
  });
}

/** Update suggestion status (used/dismissed) */
export function useUpdateSuggestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ suggestionId, status }: { suggestionId: string; status: "active" | "used" | "dismissed" }) => {
      return await callInsights("update_suggestion", { suggestionId, status });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saved-suggestions"] });
    },
  });
}

/** Real leads needing reply (from copilot_lead_context) */
export function useStaleLeads(businessId?: string) {
  return useQuery({
    queryKey: ["stale-leads", businessId],
    enabled: !!businessId,
    staleTime: 1000 * 60 * 3,
    queryFn: async () => {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("copilot_lead_context" as any)
        .select("*")
        .eq("business_id", businessId!)
        .or("status.eq.new,status.is.null")
        .lt("created_at", cutoff)
        .order("created_at", { ascending: true })
        .limit(10);
      return (data || []) as any[];
    },
  });
}

/** Pending bookings needing confirmation */
export function usePendingBookings(businessId?: string) {
  return useQuery({
    queryKey: ["pending-bookings", businessId],
    enabled: !!businessId,
    staleTime: 1000 * 60 * 3,
    queryFn: async () => {
      const { data } = await supabase
        .from("copilot_booking_context" as any)
        .select("*")
        .eq("business_id", businessId!)
        .eq("status", "pending")
        .order("booking_date", { ascending: true })
        .limit(10);
      return (data || []) as any[];
    },
  });
}

/** Completed bookings needing review request */
export function useCompletedBookings(businessId?: string) {
  return useQuery({
    queryKey: ["completed-bookings-review", businessId],
    enabled: !!businessId,
    staleTime: 1000 * 60 * 3,
    queryFn: async () => {
      const { data } = await supabase
        .from("copilot_booking_context" as any)
        .select("*")
        .eq("business_id", businessId!)
        .eq("status", "completed")
        .order("booking_date", { ascending: false })
        .limit(10);
      return (data || []) as any[];
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
