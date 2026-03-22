import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Create a portal-scoped supabase client that sends the x-portal-token header
function createPortalClient(portalToken: string) {
  return createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    { global: { headers: { "x-portal-token": portalToken } } }
  );
}

// ── Portal token management (business side) ──

export function useCreatePortalToken() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (leadId: string) => {
      // Upsert: if token exists for this lead, refresh it
      const { data: existing } = await supabase
        .from("client_portal_tokens")
        .select("id, token")
        .eq("lead_id", leadId)
        .eq("user_id", user!.id)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("client_portal_tokens")
          .update({ expires_at: new Date(Date.now() + 90 * 86400000).toISOString() })
          .eq("id", existing.id)
          .select("token")
          .single();
        if (error) throw error;
        return (data as any).token as string;
      }

      const { data, error } = await supabase
        .from("client_portal_tokens")
        .insert({ lead_id: leadId, user_id: user!.id })
        .select("token")
        .single();
      if (error) throw error;
      return (data as any).token as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portal-tokens"] });
      toast.success("Portal link generated");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function usePortalTokens() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["portal-tokens"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_portal_tokens")
        .select("*, leads(name, email)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

// ── Portal data fetching (public side, token-based) ──

export function usePortalSession(token?: string) {
  return useQuery({
    queryKey: ["portal-session", token],
    enabled: !!token,
    queryFn: async () => {
      // Use a portal-scoped client that sends the token as a header for RLS
      const portalClient = createPortalClient(token!);
      const { data: tokenData, error: tokenError } = await portalClient
        .from("client_portal_tokens")
        .select("lead_id, user_id, expires_at")
        .eq("token", token!)
        .single();
      if (tokenError || !tokenData) throw new Error("Invalid or expired portal link");
      if (new Date((tokenData as any).expires_at) < new Date()) throw new Error("Portal link expired");

      const leadId = (tokenData as any).lead_id as string;
      const userId = (tokenData as any).user_id as string;

      // Fetch lead info
      const { data: lead } = await supabase
        .from("leads")
        .select("id, name, email, phone, company")
        .eq("id", leadId)
        .single();

      // Fetch business profile via restricted view (excludes PII like phone/email)
      const { data: profile } = await supabase
        .from("client_safe_profiles" as any)
        .select("name, company, handle, avatar_url, city, bio")
        .eq("id", userId)
        .single();

      return { lead: lead as any, profile: profile as any, userId, leadId };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePortalBookings(userId?: string, leadId?: string) {
  return useQuery({
    queryKey: ["portal-bookings", leadId],
    enabled: !!userId && !!leadId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, booking_services(name, duration_min, price)")
        .eq("user_id", userId!)
        .eq("lead_id", leadId!)
        .order("start_datetime", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function usePortalJobs(userId?: string, leadId?: string) {
  return useQuery({
    queryKey: ["portal-jobs", leadId],
    enabled: !!userId && !!leadId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("id, title, job_number, status, scheduled_start, scheduled_end, actual_start, actual_end, job_type, created_at")
        .eq("user_id", userId!)
        .eq("lead_id", leadId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function usePortalInvoices(userId?: string, leadId?: string) {
  return useQuery({
    queryKey: ["portal-invoices", leadId],
    enabled: !!userId && !!leadId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("id, invoice_number, status, issue_date, due_date, grand_total, amount_paid, sent_at, paid_at")
        .eq("user_id", userId!)
        .eq("lead_id", leadId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function usePortalEstimates(userId?: string, leadId?: string) {
  return useQuery({
    queryKey: ["portal-estimates", leadId],
    enabled: !!userId && !!leadId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estimates")
        .select("id, estimate_number, status, issue_date, expiry_date, grand_total, scope_of_work, job_type")
        .eq("user_id", userId!)
        .eq("lead_id", leadId!)
        .in("status", ["sent", "approved", "declined"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function usePortalMessages(userId?: string, leadId?: string) {
  return useQuery({
    queryKey: ["portal-messages", leadId],
    enabled: !!userId && !!leadId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_portal_messages")
        .select("*")
        .eq("user_id", userId!)
        .eq("lead_id", leadId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function useSendPortalMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, leadId, message, portalToken }: { userId: string; leadId: string; message: string; portalToken?: string }) => {
      const client = portalToken ? createPortalClient(portalToken) : supabase;
      const { error } = await client
        .from("client_portal_messages")
        .insert({ user_id: userId, lead_id: leadId, message, sender: "client" });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["portal-messages", vars.leadId] });
      toast.success("Message sent");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// Approve estimate from portal
export function usePortalApproveEstimate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (estimateId: string) => {
      const { error } = await supabase
        .from("estimates")
        .update({ status: "approved" as any, approved_at: new Date().toISOString() })
        .eq("id", estimateId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portal-estimates"] });
      toast.success("Estimate approved");
    },
    onError: (e: any) => toast.error(e.message),
  });
}
