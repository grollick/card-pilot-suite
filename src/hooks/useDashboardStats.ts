import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, startOfWeek, startOfMonth, subDays } from "date-fns";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const now = new Date();
      const todayStart = startOfDay(now).toISOString();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString();

      // Parallelize all queries
      const [leadsRes, bookingsRes, openLeadsRes, stagesRes, leadsWithStageRes] = await Promise.all([
        supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .gte("created_at", todayStart),
        supabase
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .gte("created_at", weekStart),
        supabase
          .from("leads")
          .select("id, pipeline_stages(is_won, is_lost)")
          .eq("status", "open"),
        supabase
          .from("pipeline_stages")
          .select("id, name, sort_order")
          .order("sort_order", { ascending: true }),
        supabase
          .from("leads")
          .select("stage_id")
          .eq("status", "open"),
      ]);

      const activeOpps = (openLeadsRes.data ?? []).filter((l: any) => {
        const s = l.pipeline_stages;
        return !s?.is_won && !s?.is_lost;
      });

      const stages = stagesRes.data ?? [];
      const leadsWithStage = leadsWithStageRes.data ?? [];
      const stageCounts = stages.map(s => ({
        id: s.id,
        name: s.name,
        count: leadsWithStage.filter(l => l.stage_id === s.id).length,
      }));

      const totalPipelineLeads = stageCounts.reduce((s, c) => s + c.count, 0);

      return {
        leadsToday: leadsRes.count ?? 0,
        bookingsWeek: bookingsRes.count ?? 0,
        activeOpportunities: activeOpps.length,
        pipelineValue: totalPipelineLeads,
        stageCounts,
      };
    },
    refetchInterval: 60_000,
  });
}

export function useBusinessPerformance() {
  return useQuery({
    queryKey: ["business-performance"],
    queryFn: async () => {
      const now = new Date();
      const monthStart = startOfMonth(now).toISOString();

      // Parallelize all queries
      const [viewsRes, leadsRes, bookingsRes, servicesRes] = await Promise.all([
        supabase
          .from("analytics_events")
          .select("*", { count: "exact", head: true })
          .eq("event_type", "card_view")
          .gte("created_at", monthStart),
        supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .gte("created_at", monthStart),
        supabase
          .from("bookings")
          .select("id, service_id")
          .gte("created_at", monthStart),
        supabase
          .from("booking_services")
          .select("price")
          .eq("active", true),
      ]);

      const bookingCount = bookingsRes.data?.length ?? 0;
      const prices = (servicesRes.data ?? []).map(s => s.price ?? 0).filter(p => p > 0);
      const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;

      const estimatedRevenue = Math.round(bookingCount * avgPrice);
      const viewsThisMonth = viewsRes.count ?? 0;
      const leadsThisMonth = leadsRes.count ?? 0;
      const conversionRate = viewsThisMonth > 0
        ? Math.round((leadsThisMonth / viewsThisMonth) * 100)
        : 0;

      return {
        views: viewsThisMonth,
        leads: leadsThisMonth,
        bookings: bookingCount,
        estimatedRevenue,
        conversionRate,
        avgPrice: Math.round(avgPrice),
      };
    },
    refetchInterval: 60_000,
  });
}

export function useYesterdaySnapshot() {
  return useQuery({
    queryKey: ["yesterday-snapshot"],
    queryFn: async () => {
      const now = new Date();
      const yesterdayStart = startOfDay(subDays(now, 1)).toISOString();
      const todayStart = startOfDay(now).toISOString();

      // Parallelize all queries
      const [viewsRes, leadsRes, bookingsRes, servicesRes, followupsRes] = await Promise.all([
        supabase
          .from("analytics_events")
          .select("*", { count: "exact", head: true })
          .eq("event_type", "card_view")
          .gte("created_at", yesterdayStart)
          .lt("created_at", todayStart),
        supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .gte("created_at", yesterdayStart)
          .lt("created_at", todayStart),
        supabase
          .from("bookings")
          .select("id, service_id")
          .gte("created_at", yesterdayStart)
          .lt("created_at", todayStart),
        supabase
          .from("booking_services")
          .select("price")
          .eq("active", true),
        supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("status", "open")
          .lte("due_date", todayStart.split("T")[0]),
      ]);

      const prices = (servicesRes.data ?? []).map(s => s.price ?? 0).filter(p => p > 0);
      const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
      const bookingCount = bookingsRes.data?.length ?? 0;

      return {
        views: viewsRes.count ?? 0,
        leads: leadsRes.count ?? 0,
        bookings: bookingCount,
        potentialRevenue: Math.round(bookingCount * avgPrice),
        followupsNeeded: followupsRes.count ?? 0,
      };
    },
    refetchInterval: 120_000,
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ["dashboard-recent-activity"],
    queryFn: async () => {
      const since = subDays(new Date(), 7).toISOString();

      const { data: recentLeads } = await supabase
        .from("leads")
        .select("id, name, source, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(10);

      const { data: recentBookings } = await supabase
        .from("bookings")
        .select("id, customer_name, status, created_at, booking_services(name)")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(10);

      const { data: recentQuotes } = await supabase
        .from("quote_requests")
        .select("id, project_type, status, created_at, leads(name)")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(10);

      const { data: recentScans } = await supabase
        .from("qr_scans")
        .select("id, device, created_at, qr_campaigns(name)")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(10);

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
