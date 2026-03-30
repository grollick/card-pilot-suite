import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

async function callInsights(action: string, context?: any) {
  const { data, error } = await supabase.functions.invoke("provider-insights", {
    body: { action, context },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data?.result;
}

export interface AutoReplySettings {
  auto_reply_enabled: boolean;
  auto_follow_up_enabled: boolean;
  review_before_send: boolean;
  reply_tone: string;
  business_hours_only: boolean;
  high_intent_only: boolean;
}

export interface ReplyStats {
  total_replies: number;
  sent_replies: number;
  auto_sent_replies: number;
  edited_replies: number;
  leads_answered: number;
  replies_30d: number;
  replies_7d: number;
}

export function useAutoReplySettings() {
  const { user } = useAuth();
  return useQuery<AutoReplySettings | null>({
    queryKey: ["auto-reply-settings", user?.id],
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
    queryFn: () => callInsights("get_auto_reply_settings"),
  });
}

export function useSaveAutoReplySettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settings: Partial<AutoReplySettings>) =>
      callInsights("save_auto_reply_settings", { settings }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["auto-reply-settings"] }),
  });
}

export function useReplyStats() {
  const { user } = useAuth();
  return useQuery<ReplyStats>({
    queryKey: ["reply-stats", user?.id],
    enabled: !!user,
    staleTime: 1000 * 60 * 3,
    queryFn: () => callInsights("get_reply_stats"),
  });
}

export function useLogReply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ctx: {
      leadId?: string;
      bookingId?: string;
      messageType: string;
      content: string;
      wasAutoSent?: boolean;
      wasUserEdited?: boolean;
    }) => callInsights("log_reply", ctx),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reply-stats"] }),
  });
}
