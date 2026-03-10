import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { addDays, subDays, startOfDay, format } from "date-fns";

export type OpportunityBucket =
  | "overdue"
  | "new_no_response"
  | "due_soon"
  | "stale"
  | "unapproved_estimate"
  | "empty_schedule"
  | "inactive_customer";

export interface FollowUpContact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  stage_name: string | null;
  source: string;
  last_activity_at: string | null;
  next_activity_at: string | null;
  created_at: string;
  bucket: OpportunityBucket;
  bucket_label: string;
  potential_value: number | null;
  suggestion: string | null;
  urgency: "urgent" | "warning" | "info";
  related_id?: string | null;
}

export function useNeedsFollowUp() {
  return useQuery({
    queryKey: ["needs-follow-up"],
    queryFn: async () => {
      const now = new Date();
      const twoDaysFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      const threeDaysAgo = subDays(now, 3);
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      const thirtyDaysAgo = subDays(now, 30);
      const nextThreeDays = addDays(now, 3);

      // --- Parallel queries ---
      const [
        contactsRes,
        estimatesRes,
        servicesRes,
        bookingsNextRes,
        availabilityRes,
        completedJobsRes,
      ] = await Promise.all([
        supabase
          .from("leads")
          .select("*, pipeline_stages(name)")
          .eq("status", "open")
          .order("next_activity_at", { ascending: true, nullsFirst: false })
          .limit(50),
        supabase
          .from("estimates")
          .select("id, estimate_number, grand_total, lead_id, status, created_at, leads(id, name, email, phone)")
          .in("status", ["sent", "viewed"])
          .order("created_at", { ascending: true })
          .limit(20),
        supabase
          .from("booking_services")
          .select("price")
          .eq("active", true),
        supabase
          .from("bookings")
          .select("id, start_datetime")
          .gte("start_datetime", startOfDay(now).toISOString())
          .lte("start_datetime", nextThreeDays.toISOString())
          .neq("status", "cancelled"),
        supabase
          .from("availability_rules")
          .select("day_of_week, start_time, end_time"),
        supabase
          .from("jobs")
          .select("lead_id, leads(id, name, email, phone, last_activity_at, status, source, created_at, next_activity_at, stage_id, pipeline_stages(name))")
          .eq("status", "completed")
          .lte("actual_end", thirtyDaysAgo.toISOString())
          .order("actual_end", { ascending: false })
          .limit(20),
      ]);

      const contacts = contactsRes.data ?? [];
      const estimates = estimatesRes.data ?? [];
      const services = servicesRes.data ?? [];
      const bookingsNext = bookingsNextRes.data ?? [];
      const availability = availabilityRes.data ?? [];
      const completedJobs = completedJobsRes.data ?? [];

      // Average service price for value estimation
      const prices = services.map(s => s.price ?? 0).filter(p => p > 0);
      const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;

      // Activity counts for new lead detection
      const contactIds = contacts.map(c => c.id);
      const { data: activityCounts } = await supabase
        .from("contact_activities")
        .select("lead_id")
        .in("lead_id", contactIds.length > 0 ? contactIds : ["__none__"])
        .in("activity_type", ["note_added", "email_sent", "task_created", "booking_created", "call"]);
      const contactsWithActivity = new Set((activityCounts ?? []).map(a => a.lead_id));

      const buckets: FollowUpContact[] = [];

      // ---- CONTACT-BASED OPPORTUNITIES ----
      for (const c of contacts) {
        const stageName = (c as any).pipeline_stages?.name ?? null;
        const base = {
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          status: c.status,
          stage_name: stageName,
          source: c.source,
          last_activity_at: c.last_activity_at,
          next_activity_at: c.next_activity_at,
          created_at: c.created_at,
        };

        // Bucket A: Overdue task
        if (c.next_activity_at && new Date(c.next_activity_at) < now) {
          buckets.push({
            ...base,
            bucket: "overdue",
            bucket_label: "Overdue",
            potential_value: Math.round(avgPrice),
            suggestion: "This contact has an overdue follow-up. Reach out today to avoid losing the opportunity.",
            urgency: "urgent",
          });
          continue;
        }

        // Bucket B: New lead no response
        const isNewLead = stageName?.toLowerCase().includes("new") || !c.stage_id;
        const createdBeforeTwoHours = new Date(c.created_at) < twoHoursAgo;
        const hasActivity = contactsWithActivity.has(c.id);
        if (isNewLead && createdBeforeTwoHours && !hasActivity) {
          const hoursAgo = Math.round((now.getTime() - new Date(c.created_at).getTime()) / (60 * 60 * 1000));
          buckets.push({
            ...base,
            bucket: "new_no_response",
            bucket_label: "New",
            potential_value: Math.round(avgPrice),
            suggestion: `This lead submitted a form ${hoursAgo}h ago but has not been contacted.`,
            urgency: "urgent",
          });
          continue;
        }

        // Bucket C: Due soon
        if (c.next_activity_at && new Date(c.next_activity_at) < twoDaysFromNow) {
          buckets.push({
            ...base,
            bucket: "due_soon",
            bucket_label: "Due soon",
            potential_value: null,
            suggestion: null,
            urgency: "warning",
          });
          continue;
        }

        // Bucket D: Stale
        const isStale = !c.last_activity_at || new Date(c.last_activity_at) < threeDaysAgo;
        const isContactedOrQualified = stageName && (
          stageName.toLowerCase().includes("contact") ||
          stageName.toLowerCase().includes("qualif") ||
          stageName.toLowerCase().includes("follow")
        );
        if (isStale && isContactedOrQualified) {
          buckets.push({
            ...base,
            bucket: "stale",
            bucket_label: "Stale",
            potential_value: null,
            suggestion: "No activity in several days. Consider sending a check-in message.",
            urgency: "warning",
          });
        }
      }

      // ---- UNAPPROVED ESTIMATES ----
      for (const est of estimates) {
        const lead = (est as any).leads;
        if (!lead) continue;
        const daysSinceSent = Math.round((now.getTime() - new Date(est.created_at).getTime()) / (24 * 60 * 60 * 1000));
        if (daysSinceSent < 1) continue;
        buckets.push({
          id: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          status: "open",
          stage_name: null,
          source: "manual",
          last_activity_at: est.created_at,
          next_activity_at: null,
          created_at: est.created_at,
          bucket: "unapproved_estimate",
          bucket_label: `Estimate ${est.status}`,
          potential_value: Number(est.grand_total) || null,
          suggestion: `Estimate #${est.estimate_number} ($${Number(est.grand_total).toLocaleString()}) was sent ${daysSinceSent} day${daysSinceSent > 1 ? "s" : ""} ago. Consider sending a reminder.`,
          urgency: daysSinceSent >= 3 ? "urgent" : "warning",
          related_id: est.id,
        });
      }

      // ---- EMPTY SCHEDULE (next 3 days) ----
      if (availability.length > 0) {
        for (let d = 0; d < 3; d++) {
          const date = addDays(now, d);
          const dow = date.getDay();
          const hasAvailability = availability.some(r => r.day_of_week === dow);
          if (!hasAvailability) continue;

          const dayStart = startOfDay(date).toISOString();
          const dayEnd = startOfDay(addDays(date, 1)).toISOString();
          const dayBookings = bookingsNext.filter(
            b => b.start_datetime >= dayStart && b.start_datetime < dayEnd
          );

          if (dayBookings.length === 0) {
            const dayLabel = d === 0 ? "Today" : d === 1 ? "Tomorrow" : format(date, "EEEE");
            buckets.push({
              id: `empty-${d}`,
              name: `${dayLabel}'s schedule is empty`,
              email: null,
              phone: null,
              status: "info",
              stage_name: null,
              source: "system",
              last_activity_at: null,
              next_activity_at: date.toISOString(),
              created_at: now.toISOString(),
              bucket: "empty_schedule",
              bucket_label: "Empty day",
              potential_value: Math.round(avgPrice * 2),
              suggestion: `You have open booking slots on ${dayLabel}. Consider promoting availability or reaching out to pending leads.`,
              urgency: d === 0 ? "urgent" : "warning",
            });
          }
        }
      }

      // ---- INACTIVE CUSTOMERS (completed job 30+ days ago, no rebooking) ----
      const seenLeadIds = new Set(buckets.map(b => b.id));
      for (const job of completedJobs) {
        const lead = (job as any).leads;
        if (!lead || seenLeadIds.has(lead.id)) continue;
        if (lead.status !== "open") continue;
        seenLeadIds.add(lead.id);

        const stageName = (lead as any).pipeline_stages?.name ?? null;
        buckets.push({
          id: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          status: lead.status,
          stage_name: stageName,
          source: lead.source,
          last_activity_at: lead.last_activity_at,
          next_activity_at: lead.next_activity_at,
          created_at: lead.created_at,
          bucket: "inactive_customer",
          bucket_label: "Inactive",
          potential_value: Math.round(avgPrice),
          suggestion: "This customer completed a job over 30 days ago. Consider sending a rebooking reminder.",
          urgency: "info",
        });
      }

      // Sort by priority
      const bucketOrder: Record<OpportunityBucket, number> = {
        overdue: 0,
        new_no_response: 1,
        unapproved_estimate: 2,
        empty_schedule: 3,
        due_soon: 4,
        stale: 5,
        inactive_customer: 6,
      };

      buckets.sort((a, b) => {
        const orderDiff = bucketOrder[a.bucket] - bucketOrder[b.bucket];
        if (orderDiff !== 0) return orderDiff;
        const nextA = a.next_activity_at ?? "9999";
        const nextB = b.next_activity_at ?? "9999";
        if (nextA !== nextB) return nextA.localeCompare(nextB);
        const lastA = a.last_activity_at ?? "0000";
        const lastB = b.last_activity_at ?? "0000";
        return lastA.localeCompare(lastB);
      });

      return buckets.slice(0, 12);
    },
    refetchInterval: 60_000,
  });
}
