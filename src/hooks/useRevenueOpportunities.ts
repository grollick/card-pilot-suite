import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays } from "date-fns";

export interface RevenueOpportunity {
  id: string;
  type: "follow_up" | "rebook" | "inactive" | "review";
  title: string;
  subtitle: string;
  contactId?: string;
  contactName: string;
  contactEmail?: string | null;
  bookingId?: string;
  daysAgo?: number;
  urgency: "high" | "medium" | "low";
}

export function useRevenueOpportunities() {
  return useQuery({
    queryKey: ["revenue-opportunities"],
    queryFn: async () => {
      const opportunities: RevenueOpportunity[] = [];
      const now = new Date();

      // 1. Leads needing follow-up (created > 24h ago, no activity)
      const oneDayAgo = subDays(now, 1).toISOString();
      const { data: staleLeads } = await supabase
        .from("leads")
        .select("id, name, email, created_at, last_activity_at")
        .eq("status", "open")
        .lte("created_at", oneDayAgo)
        .or(`last_activity_at.is.null,last_activity_at.lte.${oneDayAgo}`)
        .order("created_at", { ascending: true })
        .limit(10);

      for (const lead of staleLeads ?? []) {
        const daysAgo = Math.floor((now.getTime() - new Date(lead.created_at).getTime()) / 86400000);
        opportunities.push({
          id: `followup-${lead.id}`,
          type: "follow_up",
          title: "Lead waiting for follow-up",
          subtitle: `${lead.name} — ${daysAgo} day${daysAgo !== 1 ? "s" : ""} since created`,
          contactId: lead.id,
          contactName: lead.name,
          contactEmail: lead.email,
          daysAgo,
          urgency: daysAgo > 3 ? "high" : daysAgo > 1 ? "medium" : "low",
        });
      }

      // 2. Customers ready to rebook (completed booking 30+ days ago)
      const thirtyDaysAgo = subDays(now, 30).toISOString();
      const { data: rebookable } = await supabase
        .from("bookings")
        .select("id, customer_name, customer_email, lead_id, end_datetime, booking_services(name)")
        .eq("status", "completed")
        .lte("end_datetime", thirtyDaysAgo)
        .not("lead_id", "is", null)
        .order("end_datetime", { ascending: false })
        .limit(10);

      for (const b of rebookable ?? []) {
        const daysAgo = Math.floor((now.getTime() - new Date(b.end_datetime).getTime()) / 86400000);
        opportunities.push({
          id: `rebook-${b.id}`,
          type: "rebook",
          title: "Customer ready to rebook",
          subtitle: `${b.customer_name} — ${(b.booking_services as any)?.name ?? "service"} ${daysAgo} days ago`,
          contactId: b.lead_id!,
          contactName: b.customer_name,
          contactEmail: b.customer_email,
          bookingId: b.id,
          daysAgo,
          urgency: daysAgo > 60 ? "high" : "medium",
        });
      }

      // 3. Inactive contacts (no activity 60+ days)
      const sixtyDaysAgo = subDays(now, 60).toISOString();
      const { data: inactive } = await supabase
        .from("leads")
        .select("id, name, email, last_activity_at")
        .eq("status", "open")
        .or(`last_activity_at.lte.${sixtyDaysAgo},last_activity_at.is.null`)
        .not("email", "is", null)
        .order("last_activity_at", { ascending: true })
        .limit(10);

      for (const c of inactive ?? []) {
        const lastAct = c.last_activity_at ? new Date(c.last_activity_at) : new Date(0);
        const daysAgo = Math.floor((now.getTime() - lastAct.getTime()) / 86400000);
        // Skip if already counted as follow_up
        if (opportunities.some(o => o.contactId === c.id)) continue;
        opportunities.push({
          id: `inactive-${c.id}`,
          type: "inactive",
          title: "Inactive customer — win-back opportunity",
          subtitle: `${c.name} — ${daysAgo} days since last activity`,
          contactId: c.id,
          contactName: c.name,
          contactEmail: c.email,
          daysAgo,
          urgency: daysAgo > 90 ? "high" : "medium",
        });
      }

      // 4. Completed bookings needing review requests
      const threeDaysAgo = subDays(now, 3).toISOString();
      const { data: needReview } = await supabase
        .from("bookings")
        .select("id, customer_name, customer_email, lead_id, end_datetime")
        .eq("status", "completed")
        .lte("end_datetime", threeDaysAgo)
        .gte("end_datetime", thirtyDaysAgo)
        .not("lead_id", "is", null)
        .limit(10);

      // Check which have reviews already
      const reviewLeadIds = (needReview ?? []).map(b => b.lead_id).filter(Boolean);
      const { data: existingReviews } = reviewLeadIds.length > 0
        ? await supabase.from("contact_activities").select("lead_id").in("lead_id", reviewLeadIds).eq("activity_type", "review_request_sent")
        : { data: [] };
      const reviewedIds = new Set((existingReviews ?? []).map((r: any) => r.lead_id));

      for (const b of needReview ?? []) {
        if (!b.lead_id || reviewedIds.has(b.lead_id)) continue;
        if (opportunities.some(o => o.contactId === b.lead_id && o.type === "rebook")) continue;
        const daysAgo = Math.floor((now.getTime() - new Date(b.end_datetime).getTime()) / 86400000);
        opportunities.push({
          id: `review-${b.id}`,
          type: "review",
          title: "Job completed — request a review",
          subtitle: `${b.customer_name} — completed ${daysAgo} days ago`,
          contactId: b.lead_id!,
          contactName: b.customer_name,
          contactEmail: b.customer_email,
          bookingId: b.id,
          daysAgo,
          urgency: daysAgo > 7 ? "high" : "low",
        });
      }

      // Sort by urgency
      const urgencyOrder = { high: 0, medium: 1, low: 2 };
      opportunities.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

      return opportunities;
    },
    refetchInterval: 60000,
  });
}

export function useAutomationRuns(contactId?: string) {
  return useQuery({
    queryKey: ["automation-runs", contactId],
    queryFn: async () => {
      let query = supabase
        .from("automation_runs")
        .select("*, automation_rules(trigger_type, action_type, action_config)")
        .order("created_at", { ascending: false })
        .limit(50);

      if (contactId) {
        query = query.eq("contact_id", contactId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: contactId !== undefined,
  });
}
