import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Review {
  id: string;
  user_id: string;
  lead_id: string | null;
  reviewer_name: string;
  reviewer_email: string | null;
  rating: number;
  review_text: string | null;
  is_public: boolean;
  project_id: string | null;
  source: string;
  owner_response: string | null;
  owner_response_at: string | null;
  reported: boolean;
  reported_reason: string | null;
  created_at: string;
}

export function useReviews() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["reviews", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Review[];
    },
  });
}

export function usePublicReviews(userId: string | undefined) {
  return useQuery({
    queryKey: ["public-reviews", userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews" as any)
        .select("*")
        .eq("user_id", userId!)
        .eq("is_public", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Review[];
    },
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (review: Partial<Review> & { user_id: string; reviewer_name: string }) => {
      const { data, error } = await supabase
        .from("reviews" as any)
        .insert({ ...review, is_public: false } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Review;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["public-reviews", (data as any).user_id] });
    },
  });
}

export function useToggleReviewPublic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_public }: { id: string; is_public: boolean }) => {
      const { error } = await supabase
        .from("reviews" as any)
        .update({ is_public } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["public-reviews"] });
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reviews"] }),
  });
}

export function useRespondToReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, response }: { id: string; response: string }) => {
      const { error } = await supabase
        .from("reviews" as any)
        .update({ owner_response: response, owner_response_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reviews"] }),
  });
}

export function useReportReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase
        .from("reviews" as any)
        .update({ reported: true, reported_reason: reason } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reviews"] }),
  });
}

/** Review stats for dashboard */
export function useReviewStats() {
  const { data: reviews = [] } = useReviews();
  const total = reviews.length;
  const avg = total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
  const pending = reviews.filter(r => !r.is_public && !r.reported).length;
  const thisMonth = reviews.filter(r => {
    const d = new Date(r.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return { total, avg, pending, thisMonth, reviews };
}
