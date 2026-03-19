import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// ── Unified Post Type ──
export interface SocialPost {
  id: string;
  user_id: string;
  content: string;
  platforms_json: string[];
  scheduled_at: string | null;
  status: string;
  approval_status: string;
  media_urls: string[] | null;
  created_at: string;
  updated_at: string;
  org_id: string | null;
  lead_id: string | null;
  campaign_id: string | null;
  content_label: string | null;
  platform_overrides: Record<string, { content?: string; hashtags?: string[]; media_urls?: string[] }>;
  queue_position: number | null;
  // Performance tracking
  clicks: number;
  link_clicks: number;
  leads_generated: number;
  bookings_generated: number;
  engagement_score: number;
  content_type: string | null;
  performance_notes: string | null;
}

const POST_KEY = ["social-posts"] as const;

export function useSocialPosts() {
  return useQuery({
    queryKey: POST_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as SocialPost[];
    },
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (post: Omit<Partial<SocialPost>, "id" | "user_id" | "created_at" | "updated_at"> & { content: string; platforms_json: string[] }) => {
      const { data, error } = await supabase
        .from("social_posts")
        .insert({ ...post, user_id: user!.id, platforms_json: post.platforms_json as any } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as SocialPost;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: POST_KEY }),
  });
}

export function useUpdatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, any>) => {
      const { data, error } = await supabase
        .from("social_posts")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as SocialPost;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: POST_KEY }),
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("social_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: POST_KEY }),
  });
}

export function useBulkDeletePosts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("social_posts").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: POST_KEY }),
  });
}

export function useBulkUpdatePosts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: Record<string, any> }) => {
      const { error } = await supabase.from("social_posts").update(updates as any).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: POST_KEY }),
  });
}
