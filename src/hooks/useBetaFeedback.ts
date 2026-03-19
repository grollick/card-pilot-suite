import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type FeedbackType = "bug" | "suggestion" | "confusing" | "positive";
export type FeedbackStatus = "new" | "in_review" | "planned" | "fixed";

export interface BetaFeedback {
  id: string;
  user_id: string;
  feedback_type: FeedbackType;
  message: string;
  screenshot_url: string | null;
  page_url: string | null;
  feature_tag: string | null;
  device_type: string | null;
  status: FeedbackStatus;
  admin_notes: string | null;
  meta_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Joined from admin query
  user_name?: string;
  user_email?: string;
}

// ── Auto-tagging logic ──
const FEATURE_TAG_MAP: Record<string, string> = {
  "/app/card": "card-builder",
  "/app/leads": "crm",
  "/app/pipeline": "pipeline",
  "/app/estimates": "estimates",
  "/app/invoices": "invoices",
  "/app/jobs": "jobs",
  "/app/bookings": "bookings",
  "/app/marketing": "social-marketing",
  "/app/analytics": "analytics",
  "/app/settings": "settings",
  "/app/customers": "customers",
};

export function autoTagFeature(pageUrl: string): string {
  for (const [prefix, tag] of Object.entries(FEATURE_TAG_MAP)) {
    if (pageUrl.includes(prefix)) return tag;
  }
  return "general";
}

export function detectDeviceType(): string {
  const ua = navigator.userAgent;
  if (/Mobi|Android/i.test(ua)) return "mobile";
  if (/Tablet|iPad/i.test(ua)) return "tablet";
  return "desktop";
}

// ── Hooks ──

export function useSubmitFeedback() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      feedback_type: FeedbackType;
      message: string;
      screenshot_url?: string;
      page_url?: string;
      feature_tag?: string;
      meta_json?: Record<string, unknown>;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const pageUrl = params.page_url || window.location.pathname;
      const featureTag = params.feature_tag || autoTagFeature(pageUrl);

      const { error } = await (supabase.from as any)("beta_feedback").insert({
        user_id: user.id,
        feedback_type: params.feedback_type,
        message: params.message,
        screenshot_url: params.screenshot_url ?? null,
        page_url: pageUrl,
        feature_tag: featureTag,
        device_type: detectDeviceType(),
        meta_json: params.meta_json ?? {},
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Thanks for your feedback!");
      qc.invalidateQueries({ queryKey: ["my-feedback"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useMyFeedback() {
  const { user } = useAuth();
  return useQuery<BetaFeedback[]>({
    queryKey: ["my-feedback", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("beta_feedback")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as BetaFeedback[];
    },
  });
}

export function useAdminFeedbackList() {
  return useQuery<BetaFeedback[]>({
    queryKey: ["admin-feedback-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("beta_feedback")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const userIds = [...new Set((data as BetaFeedback[]).map((f) => f.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, email")
        .in("id", userIds);
      const pm = new Map(profiles?.map((p) => [p.id, p]) ?? []);

      return (data as BetaFeedback[]).map((f) => {
        const prof = pm.get(f.user_id);
        return { ...f, user_name: prof?.name ?? undefined, user_email: prof?.email ?? undefined };
      });
    },
  });
}

export function useUpdateFeedbackStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; status?: FeedbackStatus; admin_notes?: string }) => {
      const updates: Record<string, unknown> = {};
      if (params.status) updates.status = params.status;
      if (params.admin_notes !== undefined) updates.admin_notes = params.admin_notes;
      const { error } = await supabase.from("beta_feedback").update(updates).eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-feedback-list"] });
      toast.success("Feedback updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
