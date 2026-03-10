import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays } from "date-fns";

export type FeedItem = {
  id: string;
  type: "lead" | "booking" | "qr_scan";
  title: string;
  subtitle: string;
  created_at: string;
};

export function useRecentActivity() {
  return useQuery({
    queryKey: ["dashboard-recent-activity"],
    queryFn: async () => {
      const since = subDays(new Date(), 7).toISOString();

      const [leadsRes, bookingsRes, scansRes] = await Promise.all([
        supabase
          .from("leads")
          .select("id, name, source, created_at")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("bookings")
          .select("id, customer_name, status, created_at, booking_services(name)")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("qr_scans")
          .select("id, device, created_at, qr_campaigns(name)")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      const feed: FeedItem[] = [
        ...(leadsRes.data ?? []).map(l => ({
          id: l.id,
          type: "lead" as const,
          title: l.name,
          subtitle: `New lead via ${l.source.replace("_", " ")}`,
          created_at: l.created_at,
        })),
        ...(bookingsRes.data ?? []).map(b => ({
          id: b.id,
          type: "booking" as const,
          title: b.customer_name,
          subtitle: `Booking ${b.status}${(b as any).booking_services?.name ? ` · ${(b as any).booking_services.name}` : ""}`,
          created_at: b.created_at,
        })),
        ...(scansRes.data ?? []).map(s => ({
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
