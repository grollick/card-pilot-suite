import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProviderBusiness } from "./useProviderInsights";

export interface BusinessNotification {
  id: string;
  business_id: string;
  type: string;
  title: string;
  body: string | null;
  urgency: string;
  entity_type: string | null;
  entity_id: string | null;
  action_label: string | null;
  is_read: boolean;
  created_at: string;
}

const URGENCY_ORDER: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function useNotifications() {
  const { user } = useAuth();
  const { data: biz } = useProviderBusiness();
  const businessId = biz?.id;

  return useQuery<BusinessNotification[]>({
    queryKey: ["business-notifications", businessId],
    enabled: !!user && !!businessId,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_notifications")
        .select("*")
        .eq("business_id", businessId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return ((data as any[]) ?? []).sort((a, b) => {
        if (a.is_read !== b.is_read) return a.is_read ? 1 : -1;
        const ua = URGENCY_ORDER[a.urgency] ?? 1;
        const ub = URGENCY_ORDER[b.urgency] ?? 1;
        if (ua !== ub) return ua - ub;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }) as BusinessNotification[];
    },
  });
}

export function useUnreadCount() {
  const { data: notifications } = useNotifications();
  return notifications?.filter((n) => !n.is_read).length ?? 0;
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("business_notifications")
        .update({ is_read: true } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business-notifications"] }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  const { data: ctx } = useProviderInsights();
  const businessId = ctx?.business_id;

  return useMutation({
    mutationFn: async () => {
      if (!businessId) return;
      const { error } = await supabase
        .from("business_notifications")
        .update({ is_read: true } as any)
        .eq("business_id", businessId)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business-notifications"] }),
  });
}
