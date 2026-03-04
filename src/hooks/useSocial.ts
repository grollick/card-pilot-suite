import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

// ── Posts ──
export function useSocialPosts() {
  return useQuery({
    queryKey: ["social-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (post: {
      content: string;
      platforms_json: string[];
      scheduled_at?: string | null;
      status?: "draft" | "scheduled";
      media_urls?: string[] | null;
    }) => {
      const { data, error } = await supabase
        .from("social_posts")
        .insert({ ...post, user_id: user!.id, platforms_json: post.platforms_json as any })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["social-posts"] }),
  });
}

export function useUpdatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<TablesUpdate<"social_posts">>) => {
      const { data, error } = await supabase
        .from("social_posts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["social-posts"] }),
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("social_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["social-posts"] }),
  });
}

// ── Accounts ──
export function useSocialAccounts() {
  return useQuery({
    queryKey: ["social-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_accounts")
        .select("*")
        .order("provider");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useToggleAccount() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ provider, connected, account_name }: { provider: string; connected: boolean; account_name?: string }) => {
      // Upsert: find existing or create
      const { data: existing } = await supabase
        .from("social_accounts")
        .select("id")
        .eq("user_id", user!.id)
        .eq("provider", provider)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("social_accounts")
          .update({ connected, account_name })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("social_accounts")
          .insert({ user_id: user!.id, provider, connected, account_name });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["social-accounts"] }),
  });
}
