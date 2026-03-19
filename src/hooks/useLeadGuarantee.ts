import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { subDays } from "date-fns";

export interface LeadGuaranteeStatus {
  /** Total leads captured in the last 30 days */
  leadsLast30Days: number;
  /** Whether the user has completed card setup */
  hasCompletedSetup: boolean;
  /** Whether the user has shared their card (at least 1 card view) */
  hasSharedCard: boolean;
  /** Whether user responds to leads (responded to at least 50% within 24h) */
  respondsToLeads: boolean;
  /** Whether user meets all conditions for the guarantee */
  isEligible: boolean;
  /** Whether the guarantee target (3 leads) was met */
  targetMet: boolean;
  /** Progress toward 3 leads as a percentage */
  progress: number;
  /** Conditions checklist for display */
  conditions: { label: string; met: boolean }[];
}

export function useLeadGuarantee() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["lead-guarantee", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<LeadGuaranteeStatus> => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

      // Parallel fetches
      const [leadsRes, profileRes, cardViewsRes, routingRes] = await Promise.all([
        // Leads in last 30 days
        supabase
          .from("leads")
          .select("id", { count: "exact", head: true })
          .gte("created_at", thirtyDaysAgo),

        // Profile completeness check
        supabase
          .from("profiles")
          .select("name, handle, phone, company, bio, onboarding_completed")
          .eq("id", user!.id)
          .single(),

        // Card views (shared card = has views)
        supabase
          .from("analytics_events")
          .select("id", { count: "exact", head: true })
          .eq("event_type", "card_view")
          .gte("created_at", thirtyDaysAgo),

        // Lead routing responsiveness
        supabase
          .from("lead_routing_log" as any)
          .select("id, responded_at, delivered_at")
          .gte("delivered_at", thirtyDaysAgo),
      ]);

      const leadsLast30Days = leadsRes.count ?? 0;

      // Setup: profile has name, handle, and onboarding completed
      const profile = profileRes.data;
      const hasCompletedSetup = !!(
        profile?.name &&
        profile?.handle &&
        profile?.onboarding_completed
      );

      // Shared: at least 1 card view
      const hasSharedCard = (cardViewsRes.count ?? 0) > 0;

      // Responsiveness: responded to >= 50% of routed leads
      const routingLogs = (routingRes.data ?? []) as any[];
      let respondsToLeads = true;
      if (routingLogs.length > 0) {
        const respondedCount = routingLogs.filter((r: any) => r.responded_at).length;
        respondsToLeads = respondedCount / routingLogs.length >= 0.5;
      }

      const isEligible = hasCompletedSetup && hasSharedCard && respondsToLeads;
      const targetMet = leadsLast30Days >= 3;
      const progress = Math.min(Math.round((leadsLast30Days / 3) * 100), 100);

      const conditions = [
        { label: "Complete your card setup", met: hasCompletedSetup },
        { label: "Share your card (get at least 1 view)", met: hasSharedCard },
        { label: "Respond to leads promptly", met: respondsToLeads },
      ];

      return {
        leadsLast30Days,
        hasCompletedSetup,
        hasSharedCard,
        respondsToLeads,
        isEligible,
        targetMet,
        progress,
        conditions,
      };
    },
    refetchInterval: 120_000,
  });
}
