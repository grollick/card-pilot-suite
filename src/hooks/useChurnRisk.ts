import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useActivationChecklist } from "@/hooks/useActivationChecklist";

export type ChurnRiskLevel = "none" | "low" | "medium" | "high";

export interface ChurnRiskData {
  level: ChurnRiskLevel;
  daysSinceLastActivity: number | null;
  setupComplete: boolean;
  hasLeads: boolean;
  hasBookings: boolean;
  recoveryMessage: string | null;
  recoveryAction: { label: string; route: string } | null;
}

/**
 * Detects churn risk by analyzing:
 * - Last activity timestamp (leads, bookings, estimates, analytics)
 * - Onboarding completion state
 * - Whether user has leads/bookings
 */
export function useChurnRisk(): ChurnRiskData & { isLoading: boolean } {
  const { user } = useAuth();
  const { items, progress, isLoading: checklistLoading } = useActivationChecklist();

  const { data, isLoading: queryLoading } = useQuery({
    queryKey: ["churn-risk", user?.id],
    enabled: !!user,
    staleTime: 60_000 * 5, // 5 min cache
    queryFn: async () => {
      const uid = user!.id;

      // Fetch latest activity timestamps across key tables
      const [leadRes, bookingRes, estimateRes, analyticsRes] = await Promise.all([
        supabase
          .from("leads")
          .select("created_at")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("bookings")
          .select("created_at")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("estimates")
          .select("created_at")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("analytics_events")
          .select("created_at")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(1),
      ]);

      const dates = [
        leadRes.data?.[0]?.created_at,
        bookingRes.data?.[0]?.created_at,
        estimateRes.data?.[0]?.created_at,
        analyticsRes.data?.[0]?.created_at,
      ]
        .filter(Boolean)
        .map((d) => new Date(d!).getTime());

      const latestActivity = dates.length > 0 ? Math.max(...dates) : null;
      const daysSince = latestActivity
        ? Math.floor((Date.now() - latestActivity) / (1000 * 60 * 60 * 24))
        : null;

      return {
        daysSinceLastActivity: daysSince,
        hasLeads: (leadRes.data?.length ?? 0) > 0,
        hasBookings: (bookingRes.data?.length ?? 0) > 0,
      };
    },
  });

  const isLoading = checklistLoading || queryLoading;
  const daysSince = data?.daysSinceLastActivity ?? null;
  const hasLeads = data?.hasLeads ?? false;
  const hasBookings = data?.hasBookings ?? false;

  // Setup complete = at least 50% of checklist done
  const setupComplete = progress >= 50;

  // Determine risk level
  let level: ChurnRiskLevel = "none";
  if (daysSince !== null) {
    if (daysSince >= 14 || (!setupComplete && daysSince >= 7)) {
      level = "high";
    } else if (daysSince >= 7 || (!hasLeads && daysSince >= 3)) {
      level = "medium";
    } else if (daysSince >= 3) {
      level = "low";
    }
  } else if (!setupComplete) {
    // No activity at all after signup
    level = "high";
  }

  // Recovery messaging
  let recoveryMessage: string | null = null;
  let recoveryAction: { label: string; route: string } | null = null;

  if (level === "high") {
    if (!setupComplete) {
      recoveryMessage = "You're one step away from your first lead. Finish your setup to start getting customers.";
      recoveryAction = { label: "Continue Setup", route: "/app/card" };
    } else if (!hasLeads) {
      recoveryMessage = "Your card is ready — share it to get your first lead. Most users see results within 48 hours.";
      recoveryAction = { label: "Share Your Card", route: "/app/card/qr" };
    } else if (!hasBookings) {
      recoveryMessage = "You have leads waiting! Follow up to book your first customer.";
      recoveryAction = { label: "View Contacts", route: "/app/contacts" };
    }
  } else if (level === "medium") {
    if (!hasLeads) {
      recoveryMessage = "Share your card to more people — leads are just around the corner.";
      recoveryAction = { label: "Share Card", route: "/app/card/qr" };
    } else {
      recoveryMessage = "Check in on your leads — quick follow-ups close more deals.";
      recoveryAction = { label: "View Contacts", route: "/app/contacts" };
    }
  }

  return {
    level,
    daysSinceLastActivity: daysSince,
    setupComplete,
    hasLeads,
    hasBookings,
    recoveryMessage,
    recoveryAction,
    isLoading,
  };
}
