import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  bucket: "overdue" | "new_no_response" | "due_soon" | "stale";
  bucket_label: string;
}

export function useNeedsFollowUp() {
  return useQuery({
    queryKey: ["needs-follow-up"],
    queryFn: async () => {
      const now = new Date();
      const twoDaysFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      // Fetch open contacts with stage info
      const { data: contacts, error } = await supabase
        .from("leads")
        .select("*, pipeline_stages(name)")
        .eq("status", "open")
        .order("next_activity_at", { ascending: true, nullsFirst: false })
        .limit(50);

      if (error) throw error;
      if (!contacts) return [];

      // Also fetch activity counts for new lead detection
      const contactIds = contacts.map(c => c.id);
      const { data: activityCounts } = await supabase
        .from("contact_activities")
        .select("lead_id")
        .in("lead_id", contactIds)
        .in("activity_type", ["note_added", "email_sent", "task_created", "booking_created", "call"]);

      const contactsWithActivity = new Set((activityCounts ?? []).map(a => a.lead_id));

      const buckets: FollowUpContact[] = [];

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
          buckets.push({ ...base, bucket: "overdue", bucket_label: "Overdue" });
          continue;
        }

        // Bucket B: New lead no response
        const isNewLead = stageName?.toLowerCase().includes("new") || !c.stage_id;
        const createdBeforeTwoHours = new Date(c.created_at) < twoHoursAgo;
        const hasActivity = contactsWithActivity.has(c.id);
        if (isNewLead && createdBeforeTwoHours && !hasActivity) {
          buckets.push({ ...base, bucket: "new_no_response", bucket_label: "New" });
          continue;
        }

        // Bucket C: Due soon
        if (c.next_activity_at && new Date(c.next_activity_at) < twoDaysFromNow) {
          buckets.push({ ...base, bucket: "due_soon", bucket_label: "Due soon" });
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
          buckets.push({ ...base, bucket: "stale", bucket_label: "Stale" });
        }
      }

      // Sort by priority bucket order, then by next_activity_at, then last_activity_at
      const bucketOrder = { overdue: 0, new_no_response: 1, due_soon: 2, stale: 3 };
      buckets.sort((a, b) => {
        const orderDiff = bucketOrder[a.bucket] - bucketOrder[b.bucket];
        if (orderDiff !== 0) return orderDiff;
        // tie-break by earliest next_activity_at
        const nextA = a.next_activity_at ?? "9999";
        const nextB = b.next_activity_at ?? "9999";
        if (nextA !== nextB) return nextA.localeCompare(nextB);
        // then oldest last_activity_at
        const lastA = a.last_activity_at ?? "0000";
        const lastB = b.last_activity_at ?? "0000";
        return lastA.localeCompare(lastB);
      });

      return buckets.slice(0, 10);
    },
    refetchInterval: 60_000, // refresh every minute
  });
}
