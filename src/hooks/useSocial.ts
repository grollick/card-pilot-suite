import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// ── Types for new tables (until types.ts auto-regenerates) ──
export interface SocialCampaign {
  id: string;
  user_id: string;
  org_id: string | null;
  name: string;
  description: string | null;
  color: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface QueueSlot {
  id: string;
  user_id: string;
  account_id: string | null;
  platform: string;
  day_of_week: number;
  time_slot: string;
  enabled: boolean;
  created_at: string;
}

export interface SocialPostExtended {
  id: string;
  user_id: string;
  content: string;
  platforms_json: string[];
  scheduled_at: string | null;
  status: string;
  media_urls: string[] | null;
  created_at: string;
  updated_at: string;
  org_id: string | null;
  lead_id: string | null;
  campaign_id: string | null;
  content_label: string | null;
  approval_status: string;
  platform_overrides: Record<string, { content?: string; hashtags?: string[]; media_urls?: string[] }>;
  queue_position: number | null;
}

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
      return (data ?? []) as unknown as SocialPostExtended[];
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
      status?: string;
      media_urls?: string[] | null;
      campaign_id?: string | null;
      content_label?: string | null;
      approval_status?: string;
      platform_overrides?: Record<string, any>;
      queue_position?: number | null;
    }) => {
      const { data, error } = await supabase
        .from("social_posts")
        .insert({ ...post, user_id: user!.id, platforms_json: post.platforms_json as any } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as SocialPostExtended;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["social-posts"] }),
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
      return data as unknown as SocialPostExtended;
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

export function useBulkDeletePosts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("social_posts").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["social-posts"] }),
  });
}

export function useBulkUpdatePosts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: Record<string, any> }) => {
      const { error } = await supabase.from("social_posts").update(updates as any).in("id", ids);
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
      const { data: existing } = await supabase
        .from("social_accounts")
        .select("id")
        .eq("user_id", user!.id)
        .eq("provider", provider)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("social_accounts")
          .update({ connected, account_name } as any)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("social_accounts")
          .insert({ user_id: user!.id, provider, connected, account_name } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["social-accounts"] }),
  });
}

// ── Campaigns ──
export function useSocialCampaigns() {
  return useQuery({
    queryKey: ["social-campaigns"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("social_campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SocialCampaign[];
    },
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (campaign: { name: string; description?: string; color?: string }) => {
      const { data, error } = await (supabase as any)
        .from("social_campaigns")
        .insert({ ...campaign, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as SocialCampaign;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["social-campaigns"] }),
  });
}

export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("social_campaigns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["social-campaigns"] }),
  });
}

// ── Queue Slots ──
export function useQueueSlots() {
  return useQuery({
    queryKey: ["social-queue-slots"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("social_queue_slots")
        .select("*")
        .order("day_of_week")
        .order("time_slot");
      if (error) throw error;
      return (data ?? []) as QueueSlot[];
    },
  });
}

export function useCreateQueueSlot() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (slot: { platform: string; day_of_week: number; time_slot: string; account_id?: string }) => {
      const { data, error } = await (supabase as any)
        .from("social_queue_slots")
        .insert({ ...slot, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as QueueSlot;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["social-queue-slots"] }),
  });
}

export function useDeleteQueueSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("social_queue_slots").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["social-queue-slots"] }),
  });
}
