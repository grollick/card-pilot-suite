import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay } from "date-fns";

export interface ActionItem {
  id: string;
  type: "leads_waiting" | "estimates_pending" | "jobs_today" | "invoices_overdue" | "tasks_due" | "bookings_pending" | "followups_needed";
  count: number;
  label: string;
  route: string;
  urgency: "high" | "medium" | "low";
}

export function useNextActions() {
  return useQuery({
    queryKey: ["next-actions"],
    queryFn: async () => {
      const now = new Date();
      const todayStart = startOfDay(now).toISOString();
      const todayEnd = endOfDay(now).toISOString();
      const todayDate = now.toISOString().split("T")[0];

      const [
        unansweredLeadsRes,
        pendingEstimatesRes,
        todayJobsRes,
        overdueInvoicesRes,
        dueTasksRes,
        pendingBookingsRes,
      ] = await Promise.all([
        // Leads with no activity in the last 24h (waiting for response)
        supabase
          .from("leads")
          .select("id", { count: "exact", head: true })
          .eq("status", "open")
          .is("last_activity_at", null),

        // Estimates sent but not approved/declined
        supabase
          .from("estimates")
          .select("id", { count: "exact", head: true })
          .eq("status", "sent"),

        // Jobs scheduled for today
        supabase
          .from("jobs")
          .select("id", { count: "exact", head: true })
          .in("status", ["scheduled", "in_progress"])
          .gte("scheduled_start", todayStart)
          .lte("scheduled_start", todayEnd),

        // Overdue invoices
        supabase
          .from("invoices")
          .select("id", { count: "exact", head: true })
          .eq("status", "overdue"),

        // Tasks due today or overdue
        supabase
          .from("tasks")
          .select("id", { count: "exact", head: true })
          .eq("status", "open")
          .lte("due_date", todayDate),

        // Bookings pending confirmation
        supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .in("status", ["requested", "pending"]),
      ]);

      // Also check leads that have no recent activity (> 48h)
      const staleDate = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
      const { count: staleLeadsCount } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("status", "open")
        .lt("last_activity_at", staleDate);

      const noActivityCount = unansweredLeadsRes.count ?? 0;
      const totalWaiting = noActivityCount + (staleLeadsCount ?? 0);

      const items: ActionItem[] = [];

      if (totalWaiting > 0) {
        items.push({
          id: "leads_waiting",
          type: "leads_waiting",
          count: totalWaiting,
          label: totalWaiting === 1 ? "lead waiting for response" : "leads waiting for response",
          route: "/app/contacts",
          urgency: totalWaiting >= 5 ? "high" : "medium",
        });
      }

      if ((pendingEstimatesRes.count ?? 0) > 0) {
        const c = pendingEstimatesRes.count!;
        items.push({
          id: "estimates_pending",
          type: "estimates_pending",
          count: c,
          label: c === 1 ? "estimate awaiting approval" : "estimates awaiting approval",
          route: "/app/estimates",
          urgency: "medium",
        });
      }

      const jobsToday = todayJobsRes.count ?? 0;
      if (jobsToday > 0) {
        items.push({
          id: "jobs_today",
          type: "jobs_today",
          count: jobsToday,
          label: jobsToday === 1 ? "job scheduled today" : "jobs scheduled today",
          route: "/app/jobs",
          urgency: "low",
        });
      }

      if ((overdueInvoicesRes.count ?? 0) > 0) {
        const c = overdueInvoicesRes.count!;
        items.push({
          id: "invoices_overdue",
          type: "invoices_overdue",
          count: c,
          label: c === 1 ? "overdue invoice" : "overdue invoices",
          route: "/app/invoices",
          urgency: "high",
        });
      }

      if ((dueTasksRes.count ?? 0) > 0) {
        const c = dueTasksRes.count!;
        items.push({
          id: "tasks_due",
          type: "tasks_due",
          count: c,
          label: c === 1 ? "task due today" : "tasks due today",
          route: "/app/tasks",
          urgency: "medium",
        });
      }

      if ((pendingBookingsRes.count ?? 0) > 0) {
        const c = pendingBookingsRes.count!;
        items.push({
          id: "bookings_pending",
          type: "bookings_pending",
          count: c,
          label: c === 1 ? "booking needs confirmation" : "bookings need confirmation",
          route: "/app/bookings",
          urgency: c >= 3 ? "high" : "medium",
        });
      }

      // Sort by urgency
      const urgencyOrder = { high: 0, medium: 1, low: 2 };
      items.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

      return items;
    },
    refetchInterval: 30_000,
  });
}
