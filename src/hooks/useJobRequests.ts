import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface JobRequest {
  id: string;
  requester_name: string;
  requester_email: string | null;
  requester_phone: string | null;
  service_needed: string | null;
  request_details: string | null;
  budget: string | null;
  timeline: string | null;
  location: string | null;
  city: string | null;
  profession: string | null;
  status: string;
  source: string;
  tracking_token: string | null;
  created_at: string;
}

export interface JobRequestResponse {
  id: string;
  estimate_request_id: string;
  user_id: string;
  message: string;
  price_estimate: number | null;
  availability: string | null;
  status: string;
  created_at: string;
  // joined
  profile?: {
    name: string | null;
    company: string | null;
    handle: string | null;
    avatar_url: string | null;
    city: string | null;
  };
}

/** Fetch job requests matched to the current user via estimate_matches */
export function useMyJobRequests() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-job-requests", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Get matched estimate request IDs
      const { data: matches, error: matchErr } = await (supabase as any)
        .from("estimate_matches")
        .select("estimate_request_id, status, match_score")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (matchErr) throw matchErr;
      if (!matches?.length) return [];

      const requestIds = matches.map((m: any) => m.estimate_request_id);
      const { data: requests, error: reqErr } = await (supabase as any)
        .from("estimate_requests")
        .select("*")
        .in("id", requestIds)
        .order("created_at", { ascending: false });
      if (reqErr) throw reqErr;

      // Attach match info
      return (requests || []).map((r: any) => {
        const match = matches.find((m: any) => m.estimate_request_id === r.id);
        return { ...r, match_status: match?.status, match_score: match?.match_score };
      }) as (JobRequest & { match_status: string; match_score: number })[];
    },
  });
}

/** Fetch responses the current user has sent */
export function useMyJobResponses() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-job-responses", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("job_request_responses")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as JobRequestResponse[];
    },
  });
}

/** Fetch responses for a request by tracking token (customer view) */
export function useRequestResponses(trackingToken: string | undefined) {
  return useQuery({
    queryKey: ["request-responses", trackingToken],
    enabled: !!trackingToken,
    queryFn: async () => {
      // Use edge function for secure token-validated lookup
      const { data, error } = await supabase.functions.invoke("request-status", {
        body: { token: trackingToken },
      });
      if (error) throw error;
      if (!data || data.error) return null;

      const enrichedResponses = (data.responses || []) as JobRequestResponse[];
      return { request: data.request as JobRequest, responses: enrichedResponses };
    },
  });
}

/** Job request stats for dashboard */
export function useJobRequestStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["job-request-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [{ data: matches }, { data: responses }, { data: guarantee }] = await Promise.all([
        (supabase as any)
          .from("estimate_matches")
          .select("status, estimate_request_id")
          .eq("user_id", user!.id),
        (supabase as any)
          .from("job_request_responses")
          .select("id, status")
          .eq("user_id", user!.id),
        (supabase as any)
          .from("first_lead_guarantee")
          .select("status")
          .eq("user_id", user!.id)
          .maybeSingle(),
      ]);

      const total = matches?.length || 0;
      const newRequests = matches?.filter((m: any) => m.status === "pending").length || 0;
      const responsesSent = responses?.length || 0;
      const won = matches?.filter((m: any) => m.status === "accepted").length || 0;
      const hasGuaranteeMatch = guarantee?.status === "matched";

      return { total, newRequests, responsesSent, won, hasGuaranteeMatch };
    },
  });
}
