import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, format, eachDayOfInterval } from "date-fns";
import { parseDevice } from "@/lib/analytics";

// ── Core stats for a given period ──
export function useAnalyticsStats(days = 7) {
  return useQuery({
    queryKey: ["analytics-stats", days],
    queryFn: async () => {
      const since = subDays(new Date(), days).toISOString();
      const prevSince = subDays(new Date(), days * 2).toISOString();

      // Current period events
      const { data: events } = await supabase
        .from("analytics_events")
        .select("event_type, created_at")
        .gte("created_at", since);

      // Previous period events (for comparison)
      const { data: prevEvents } = await supabase
        .from("analytics_events")
        .select("event_type")
        .gte("created_at", prevSince)
        .lt("created_at", since);

      // New contacts in period
      const { count: newContacts } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .gte("created_at", since);

      const { count: prevContacts } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .gte("created_at", prevSince)
        .lt("created_at", since);

      // Bookings in period
      const { count: newBookings } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .gte("created_at", since);

      const { count: prevBookings } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .gte("created_at", prevSince)
        .lt("created_at", since);

      const curr = events ?? [];
      const prev = prevEvents ?? [];

      const views = curr.filter(e => e.event_type === "card_view").length;
      const clicks = curr.filter(e => e.event_type === "button_click").length;
      const formSubmits = curr.filter(e => e.event_type === "form_submit").length;
      const bookingEvents = curr.filter(e => e.event_type === "booking_created").length;
      const contactSaves = curr.filter(e => e.event_type === "contact_saved").length;

      const prevViews = prev.filter(e => e.event_type === "card_view").length;
      const prevClicks = prev.filter(e => e.event_type === "button_click").length;
      const prevContactSaves = prev.filter(e => e.event_type === "contact_saved").length;

      const conversionRate = views > 0 ? ((newContacts ?? 0) / views * 100) : 0;
      const prevConversionRate = prevViews > 0 ? ((prevContacts ?? 0) / prevViews * 100) : 0;

      return {
        views,
        clicks,
        formSubmits,
        bookingEvents,
        contactSaves,
        contacts: newContacts ?? 0,
        bookings: newBookings ?? 0,
        conversionRate: Math.round(conversionRate * 10) / 10,
        // Changes
        viewsChange: calcChange(views, prevViews),
        clicksChange: calcChange(clicks, prevClicks),
        contactsChange: calcChange(newContacts ?? 0, prevContacts ?? 0),
        bookingsChange: calcChange(newBookings ?? 0, prevBookings ?? 0),
        contactSavesChange: calcChange(contactSaves, prevContactSaves),
        conversionChange: Math.round((conversionRate - prevConversionRate) * 10) / 10,
        // Daily breakdown
        dailyData: buildDailyBreakdown(curr, days),
      };
    },
  });
}

// ── CTA breakdown ──
export function useCtaBreakdown(days = 30) {
  return useQuery({
    queryKey: ["cta-breakdown", days],
    queryFn: async () => {
      const since = subDays(new Date(), days).toISOString();
      const { data } = await supabase
        .from("analytics_events")
        .select("event_type, meta_json")
        .eq("event_type", "button_click")
        .gte("created_at", since);

      const counts: Record<string, number> = {};
      (data ?? []).forEach(e => {
        const meta = e.meta_json as any;
        const action = meta?.cta || meta?.action || meta?.button || "Unknown";
        counts[action] = (counts[action] || 0) + 1;
      });

      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      return Object.entries(counts)
        .map(([action, count]) => ({ action, count, pct: total > 0 ? Math.round(count / total * 100) : 0 }))
        .sort((a, b) => b.count - a.count);
    },
  });
}

// ── Referrer breakdown ──
export function useReferrerBreakdown(days = 30) {
  return useQuery({
    queryKey: ["referrer-breakdown", days],
    queryFn: async () => {
      const since = subDays(new Date(), days).toISOString();
      const { data } = await supabase
        .from("analytics_events")
        .select("meta_json")
        .eq("event_type", "card_view")
        .gte("created_at", since);

      const counts: Record<string, number> = {};
      (data ?? []).forEach(e => {
        const meta = e.meta_json as any;
        let source = "Direct";
        const referrer = meta?.referrer || "";
        const utm = meta?.utm_source;
        if (utm) {
          source = utm;
        } else if (referrer) {
          try {
            source = new URL(referrer).hostname.replace("www.", "");
          } catch {
            source = referrer.slice(0, 30);
          }
        }
        counts[source] = (counts[source] || 0) + 1;
      });

      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      return Object.entries(counts)
        .map(([source, count]) => ({ source, count, pct: total > 0 ? Math.round(count / total * 100) : 0 }))
        .sort((a, b) => b.count - a.count);
    },
  });
}

// ── Device breakdown ──
export function useDeviceBreakdown(days = 30) {
  return useQuery({
    queryKey: ["device-breakdown", days],
    queryFn: async () => {
      const since = subDays(new Date(), days).toISOString();
      const { data } = await supabase
        .from("analytics_events")
        .select("meta_json")
        .eq("event_type", "card_view")
        .gte("created_at", since);

      const counts: Record<string, number> = {};
      (data ?? []).forEach(e => {
        const meta = e.meta_json as any;
        const device = parseDevice(meta?.user_agent || meta?.device || "");
        counts[device] = (counts[device] || 0) + 1;
      });

      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      return Object.entries(counts)
        .map(([device, count]) => ({ device, count, pct: total > 0 ? Math.round(count / total * 100) : 0 }))
        .sort((a, b) => b.count - a.count);
    },
  });
}

// ── Email campaign stats ──
export function useEmailStats(days = 30) {
  return useQuery({
    queryKey: ["email-stats", days],
    queryFn: async () => {
      const since = subDays(new Date(), days).toISOString();
      const { data } = await supabase
        .from("campaign_emails")
        .select("status, sent_at")
        .gte("created_at", since);

      const emails = data ?? [];
      return {
        total: emails.length,
        sent: emails.filter(e => e.status === "sent").length,
        pending: emails.filter(e => e.status === "pending").length,
        failed: emails.filter(e => e.status === "failed").length,
        bounced: emails.filter(e => e.status === "bounced").length,
      };
    },
  });
}

// ── Helpers ──
function calcChange(curr: number, prev: number): { value: number; type: "positive" | "negative" | "neutral" } {
  if (prev === 0 && curr === 0) return { value: 0, type: "neutral" };
  if (prev === 0) return { value: 100, type: "positive" };
  const pct = Math.round(((curr - prev) / prev) * 100);
  return { value: Math.abs(pct), type: pct > 0 ? "positive" : pct < 0 ? "negative" : "neutral" };
}

function buildDailyBreakdown(events: { event_type: string; created_at: string }[], days: number) {
  const interval = eachDayOfInterval({ start: subDays(new Date(), days - 1), end: new Date() });
  return interval.map(date => {
    const dayStr = format(date, "yyyy-MM-dd");
    const dayEvents = events.filter(e => e.created_at.startsWith(dayStr));
    return {
      label: format(date, "EEE"),
      date: dayStr,
      views: dayEvents.filter(e => e.event_type === "card_view").length,
      clicks: dayEvents.filter(e => e.event_type === "button_click").length,
      contactSaves: dayEvents.filter(e => e.event_type === "contact_saved").length,
    };
  });
}
