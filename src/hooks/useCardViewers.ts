import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { subDays } from "date-fns";
import { parseDevice, getDomain } from "@/lib/analytics";

export interface CardViewer {
  id: string;
  created_at: string;
  device_type: string;
  os: string;
  browser: string;
  city: string;
  region: string;
  country: string;
  referrer: string | null;
  utm_source: string | null;
  ip_hash: string | null;
  isReturning: boolean;
  visitCount: number;
}

export function useCardViewers(days = 30) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["card-viewers", days],
    enabled: !!user,
    refetchInterval: 30_000,
    queryFn: async () => {
      const since = subDays(new Date(), days).toISOString();
      const { data, error } = await supabase
        .from("analytics_events")
        .select("id, created_at, meta_json")
        .eq("event_type", "card_view")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;

      // Count occurrences per ip_hash to detect returning visitors
      const hashCounts: Record<string, number> = {};
      (data ?? []).forEach(e => {
        const h = (e.meta_json as Record<string, any>)?.ip_hash;
        if (h) hashCounts[h] = (hashCounts[h] || 0) + 1;
      });

      return (data ?? []).map((e): CardViewer => {
        const m = (e.meta_json as Record<string, any>) ?? {};
        const ipHash = m.ip_hash || null;
        return {
          id: e.id,
          created_at: e.created_at,
          device_type: m.device_type || parseDevice(m.user_agent),
          os: m.os || "Unknown",
          browser: m.browser || "Unknown",
          city: m.city || "Unknown",
          region: m.region || "Unknown",
          country: m.country || "Unknown",
          referrer: m.referrer || null,
          utm_source: m.utm_source || null,
          ip_hash: ipHash,
          isReturning: ipHash ? (hashCounts[ipHash] ?? 0) > 1 : false,
          visitCount: ipHash ? (hashCounts[ipHash] ?? 1) : 1,
        };
      });
    },
  });
}

// parseDevice is now imported from @/lib/analytics

export function useViewerStats(days = 30) {
  const { data: viewers = [] } = useCardViewers(days);

  const totalViews = viewers.length;
  const uniqueLocations = new Set(viewers.map(v => `${v.city}-${v.country}`).filter(l => !l.includes("Unknown"))).size;
  const returningCount = new Set(viewers.filter(v => v.isReturning && v.ip_hash).map(v => v.ip_hash)).size;
  const uniqueVisitors = new Set(viewers.filter(v => v.ip_hash).map(v => v.ip_hash)).size || viewers.length;

  const deviceCounts: Record<string, number> = {};
  const locationCounts: Record<string, number> = {};
  const sourceCounts: Record<string, number> = {};

  viewers.forEach(v => {
    deviceCounts[v.device_type] = (deviceCounts[v.device_type] || 0) + 1;
    const loc = v.city !== "Unknown" ? `${v.city}, ${v.country}` : v.country;
    if (loc !== "Unknown") locationCounts[loc] = (locationCounts[loc] || 0) + 1;
    const src = v.utm_source || (v.referrer ? getDomain(v.referrer) : "Direct");
    sourceCounts[src] = (sourceCounts[src] || 0) + 1;
  });

  const topDevices = Object.entries(deviceCounts).sort((a, b) => b[1] - a[1]);
  const topLocations = Object.entries(locationCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topSources = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return { totalViews, uniqueLocations, uniqueVisitors, returningCount, topDevices, topLocations, topSources };
}

// getDomain is now imported from @/lib/analytics
