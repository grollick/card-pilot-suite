import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

function generateCode(length = 8) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export function useQRCampaigns() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["qr-campaigns", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("qr_campaigns")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useQRCampaignStats(campaignId: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["qr-campaign-stats", campaignId],
    enabled: !!user && !!campaignId,
    queryFn: async () => {
      // Total scans
      const { count: totalScans } = await supabase
        .from("qr_scans")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", campaignId!);

      // Scans with timeline
      const { data: scans } = await supabase
        .from("qr_scans")
        .select("created_at, device, lead_id")
        .eq("campaign_id", campaignId!)
        .order("created_at", { ascending: false })
        .limit(500);

      // Leads generated (scans that resulted in a lead)
      const { count: leadsGenerated } = await supabase
        .from("qr_scans")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", campaignId!)
        .not("lead_id", "is", null);

      // Get campaign code to check bookings via analytics
      const { data: campaign } = await supabase
        .from("qr_campaigns")
        .select("code")
        .eq("id", campaignId!)
        .single();

      // Device breakdown
      const devices: Record<string, number> = {};
      (scans ?? []).forEach(s => {
        const d = s.device || "Unknown";
        devices[d] = (devices[d] || 0) + 1;
      });

      const total = totalScans ?? 0;
      const leads = leadsGenerated ?? 0;
      const conversionRate = total > 0 ? Math.round((leads / total) * 1000) / 10 : 0;

      return {
        totalScans: total,
        leadsGenerated: leads,
        conversionRate,
        devices: Object.entries(devices)
          .map(([device, count]) => ({ device, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 }))
          .sort((a, b) => b.count - a.count),
        recentScans: (scans ?? []).slice(0, 20),
      };
    },
  });
}

export function useAllCampaignStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["qr-all-campaign-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: campaigns } = await supabase
        .from("qr_campaigns")
        .select("id, name, code, placement, active, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (!campaigns?.length) return [];

      const results = await Promise.all(
        campaigns.map(async (c) => {
          const { count: scans } = await supabase
            .from("qr_scans")
            .select("*", { count: "exact", head: true })
            .eq("campaign_id", c.id);

          const { count: leads } = await supabase
            .from("qr_scans")
            .select("*", { count: "exact", head: true })
            .eq("campaign_id", c.id)
            .not("lead_id", "is", null);

          return {
            ...c,
            scans: scans ?? 0,
            leads: leads ?? 0,
            conversionRate: (scans ?? 0) > 0 ? Math.round(((leads ?? 0) / (scans ?? 0)) * 1000) / 10 : 0,
          };
        })
      );

      return results;
    },
  });
}

export function useCreateQRCampaign() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, placement, description }: { name: string; placement: string; description?: string }) => {
      const code = generateCode();
      const { data, error } = await supabase
        .from("qr_campaigns")
        .insert({
          user_id: user!.id,
          name,
          code,
          placement,
          description: description || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["qr-campaigns"] });
      qc.invalidateQueries({ queryKey: ["qr-all-campaign-stats"] });
      toast.success("QR campaign created!");
    },
    onError: () => toast.error("Failed to create campaign"),
  });
}

export function useToggleQRCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("qr_campaigns")
        .update({ active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["qr-campaigns"] });
      qc.invalidateQueries({ queryKey: ["qr-all-campaign-stats"] });
    },
  });
}

export function useDeleteQRCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("qr_campaigns")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["qr-campaigns"] });
      qc.invalidateQueries({ queryKey: ["qr-all-campaign-stats"] });
      toast.success("Campaign deleted");
    },
    onError: () => toast.error("Failed to delete campaign"),
  });
}
