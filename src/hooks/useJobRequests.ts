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
      // Find the request by token
      const { data: request, error: reqErr } = await (supabase as any)
        .from("estimate_requests")
        .select("*")
        .eq("tracking_token", trackingToken)
        .maybeSingle();
      if (reqErr) throw reqErr;
      if (!request) return null;

      // Fetch responses
      const { data: responses, error: resErr } = await (supabase as any)
        .from("job_request_responses")
        .select("*")
        .eq("estimate_request_id", request.id)
        .order("created_at", { ascending: true });
      if (resErr) throw resErr;

      // Fetch profiles for each responder
      const userIds = (responses || []).map((r: any) => r.user_id);
      let profiles: any[] = [];
      if (userIds.length > 0) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, name, company, handle, avatar_url, city")
          .in("id", userIds);
        profiles = profileData || [];
      }

      const enrichedResponses = (responses || []).map((r: any) => ({
        ...r,
        profile: profiles.find((p: any) => p.id === r.user_id) || null,
      })) as JobRequestResponse[];

      return { request: request as JobRequest, responses: enrichedResponses };
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
      const { data: matches } = await (supabase as any)
        .from("estimate_matches")
        .select("status, estimate_request_id")
        .eq("user_id", user!.id);

      const { data: responses } = await (supabase as any)
        .from("job_request_responses")
        .select("id, status")
        .eq("user_id", user!.id);

      const total = matches?.length || 0;
      const newRequests = matches?.filter((m: any) => m.status === "pending").length || 0;
      const responsesSent = responses?.length || 0;
      const won = matches?.filter((m: any) => m.status === "accepted").length || 0;

      return { total, newRequests, responsesSent, won };
    },
  });
}
