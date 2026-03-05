import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, startOfWeek, subDays } from "date-fns";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const now = new Date();
      const todayStart = startOfDay(now).toISOString();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString();

      // New leads today
      const { count: leadsToday } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .gte("created_at", todayStart);

      // Bookings this week
      const { count: bookingsWeek } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekStart);

      // Active opportunities (open leads with a stage that isn't won/lost)
      const { data: openLeads } = await supabase
        .from("leads")
        .select("id, pipeline_stages(is_won, is_lost)")
        .eq("status", "open");

      const activeOpps = (openLeads ?? []).filter((l: any) => {
        const s = l.pipeline_stages;
        return !s?.is_won && !s?.is_lost;
      });

      // Pipeline snapshot — leads per stage
      const { data: stages } = await supabase
        .from("pipeline_stages")
        .select("id, name, sort_order")
        .order("sort_order", { ascending: true });

      const { data: leadsWithStage } = await supabase
        .from("leads")
        .select("stage_id")
        .eq("status", "open");

      const stageCounts = (stages ?? []).map(s => {
        const count = (leadsWithStage ?? []).filter(l => l.stage_id === s.id).length;
        return { id: s.id, name: s.name, count };
      });

      const totalPipelineLeads = stageCounts.reduce((s, c) => s + c.count, 0);

      return {
        leadsToday: leadsToday ?? 0,
        bookingsWeek: bookingsWeek ?? 0,
        activeOpportunities: activeOpps.length,
        pipelineValue: totalPipelineLeads,
        stageCounts,
      };
    },
    refetchInterval: 60_000,
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ["dashboard-recent-activity"],
    queryFn: async () => {
      const since = subDays(new Date(), 7).toISOString();

      // Recent leads
      const { data: recentLeads } = await supabase
        .from("leads")
        .select("id, name, source, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(10);

      // Recent bookings
      const { data: recentBookings } = await supabase
        .from("bookings")
        .select("id, customer_name, status, created_at, booking_services(name)")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(10);

      // Recent quote requests
      const { data: recentQuotes } = await supabase
        .from("quote_requests")
        .select("id, project_type, status, created_at, leads(name)")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(10);

      // Recent QR scans
      const { data: recentScans } = await supabase
        .from("qr_scans")
        .select("id, device, created_at, qr_campaigns(name)")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(10);

      // Merge into unified feed
      type FeedItem = {
        id: string;
        type: "lead" | "booking" | "quote" | "qr_scan";
        title: string;
        subtitle: string;
        created_at: string;
      };

      const feed: FeedItem[] = [
        ...(recentLeads ?? []).map(l => ({
          id: l.id,
          type: "lead" as const,
          title: l.name,
          subtitle: `New lead via ${l.source.replace("_", " ")}`,
          created_at: l.created_at,
        })),
        ...(recentBookings ?? []).map(b => ({
          id: b.id,
          type: "booking" as const,
          title: b.customer_name,
          subtitle: `Booking ${b.status}${(b as any).booking_services?.name ? ` · ${(b as any).booking_services.name}` : ""}`,
          created_at: b.created_at,
        })),
        ...(recentQuotes ?? []).map(q => ({
          id: q.id,
          type: "quote" as const,
          title: (q as any).leads?.name ?? "Quote request",
          subtitle: `Quote${q.project_type ? ` · ${q.project_type}` : ""} — ${q.status}`,
          created_at: q.created_at,
        })),
        ...(recentScans ?? []).map(s => ({
          id: s.id,
          type: "qr_scan" as const,
          title: (s as any).qr_campaigns?.name ?? "QR Scan",
          subtitle: `QR scan${s.device ? ` from ${s.device}` : ""}`,
          created_at: s.created_at,
        })),
      ];

      feed.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return feed.slice(0, 15);
    },
    refetchInterval: 30_000,
  });
}
