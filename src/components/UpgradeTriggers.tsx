import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileCache } from "@/hooks/useProfileCache";
import MilestoneUpgradePrompt from "@/components/MilestoneUpgradePrompt";

/**
 * Checks if the user just hit their first lead or first booking
 * and shows a contextual upgrade prompt.
 */
export default function UpgradeTriggers() {
  const { user } = useAuth();
  const [milestone, setMilestone] = useState<"first_lead" | "first_booking" | null>(null);

  // Use shared profile cache instead of a separate query
  const { data: profile } = useProfileCache();

  // Fetch lead and booking counts
  const { data: counts } = useQuery({
    queryKey: ["milestone-counts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [leadsRes, bookingsRes] = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }),
        supabase.from("bookings").select("id", { count: "exact", head: true }),
      ]);
      return {
        leads: leadsRes.count ?? 0,
        bookings: bookingsRes.count ?? 0,
      };
    },
  });

  useEffect(() => {
    if (!counts || !profile) return;
    // Only trigger for free-tier users
    const plan = profile.plan ?? "starter";
    if (plan !== "starter" && plan !== "free") return;

    // Check localStorage to avoid repeat prompts
    const dismissed = localStorage.getItem("cp_milestone_dismissed");

    if (counts.leads === 1 && !dismissed?.includes("first_lead")) {
      setMilestone("first_lead");
    } else if (counts.bookings === 1 && !dismissed?.includes("first_booking")) {
      setMilestone("first_booking");
    }
  }, [counts, profile]);

  const handleDismiss = () => {
    if (milestone) {
      const existing = localStorage.getItem("cp_milestone_dismissed") ?? "";
      localStorage.setItem("cp_milestone_dismissed", `${existing},${milestone}`);
    }
    setMilestone(null);
  };

  if (!milestone) return null;

  return (
    <MilestoneUpgradePrompt
      milestone={milestone}
      open={!!milestone}
      onOpenChange={(open) => { if (!open) handleDismiss(); }}
    />
  );
}
