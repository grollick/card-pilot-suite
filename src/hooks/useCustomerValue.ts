import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CustomerValue {
  leadId: string;
  name: string;
  company: string | null;
  totalJobs: number;
  lifetimeValue: number;
  avgJobValue: number;
  lastServiceDate: string | null;
  daysSinceLastService: number | null;
  isVip: boolean;
  repeatCount: number;
}

/**
 * Calculate CLV for a single contact.
 */
export function useContactCLV(leadId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["contact-clv", leadId],
    enabled: !!user && !!leadId,
    queryFn: async () => {
      // Get completed jobs linked to this lead
      const { data: jobs } = await supabase
        .from("jobs")
        .select("id, status, actual_end, estimate_id")
        .eq("user_id", user!.id)
        .eq("lead_id", leadId!)
        .eq("status", "completed");

      // Get approved estimates linked to this lead
      const { data: estimates } = await supabase
        .from("estimates")
        .select("id, grand_total, status")
        .eq("user_id", user!.id)
        .eq("lead_id", leadId!)
        .in("status", ["approved", "sent"]);

      const completedJobs = jobs ?? [];
      const approvedEstimates = estimates ?? [];

      // Calculate value from estimates (approved/sent)
      const estimateValues = approvedEstimates.map(e => Number(e.grand_total) || 0);
      const lifetimeValue = estimateValues.reduce((a, b) => a + b, 0);
      const totalJobs = completedJobs.length;
      const avgJobValue = totalJobs > 0 ? Math.round(lifetimeValue / totalJobs) : 0;

      // Last service date
      const sortedJobs = completedJobs
        .filter(j => j.actual_end)
        .sort((a, b) => new Date(b.actual_end!).getTime() - new Date(a.actual_end!).getTime());
      const lastServiceDate = sortedJobs[0]?.actual_end ?? null;
      const daysSinceLastService = lastServiceDate
        ? Math.floor((Date.now() - new Date(lastServiceDate).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      // Bookings count for repeat detection
      const { count: bookingCount } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("lead_id", leadId!);

      return {
        totalJobs,
        lifetimeValue: Math.round(lifetimeValue),
        avgJobValue,
        lastServiceDate,
        daysSinceLastService,
        repeatCount: bookingCount ?? 0,
      };
    },
  });
}

/**
 * Get all customers ranked by lifetime value (for dashboard widget).
 */
export function useTopCustomers(limit = 10) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["top-customers", limit],
    enabled: !!user,
    queryFn: async () => {
      // Get all leads
      const { data: leads } = await supabase
        .from("leads")
        .select("id, name, company")
        .eq("user_id", user!.id);

      if (!leads || leads.length === 0) return { customers: [], vipThreshold: 0 };

      // Get all approved estimates grouped by lead
      const { data: estimates } = await supabase
        .from("estimates")
        .select("lead_id, grand_total, status")
        .eq("user_id", user!.id)
        .in("status", ["approved", "sent"])
        .not("lead_id", "is", null);

      // Get completed jobs grouped by lead
      const { data: jobs } = await supabase
        .from("jobs")
        .select("lead_id, status, actual_end")
        .eq("user_id", user!.id)
        .eq("status", "completed")
        .not("lead_id", "is", null);

      // Aggregate per lead
      const valueMap: Record<string, { value: number; jobCount: number; lastService: string | null }> = {};

      (estimates ?? []).forEach(e => {
        if (!e.lead_id) return;
        if (!valueMap[e.lead_id]) valueMap[e.lead_id] = { value: 0, jobCount: 0, lastService: null };
        valueMap[e.lead_id].value += Number(e.grand_total) || 0;
      });

      (jobs ?? []).forEach(j => {
        if (!j.lead_id) return;
        if (!valueMap[j.lead_id]) valueMap[j.lead_id] = { value: 0, jobCount: 0, lastService: null };
        valueMap[j.lead_id].jobCount += 1;
        if (j.actual_end) {
          const current = valueMap[j.lead_id].lastService;
          if (!current || j.actual_end > current) {
            valueMap[j.lead_id].lastService = j.actual_end;
          }
        }
      });

      // Merge with lead data
      const customers: CustomerValue[] = leads
        .map(lead => {
          const stats = valueMap[lead.id] ?? { value: 0, jobCount: 0, lastService: null };
          const daysSince = stats.lastService
            ? Math.floor((Date.now() - new Date(stats.lastService).getTime()) / (1000 * 60 * 60 * 24))
            : null;
          return {
            leadId: lead.id,
            name: lead.name,
            company: lead.company,
            totalJobs: stats.jobCount,
            lifetimeValue: Math.round(stats.value),
            avgJobValue: stats.jobCount > 0 ? Math.round(stats.value / stats.jobCount) : 0,
            lastServiceDate: stats.lastService,
            daysSinceLastService: daysSince,
            isVip: false,
            repeatCount: stats.jobCount,
          };
        })
        .filter(c => c.lifetimeValue > 0)
        .sort((a, b) => b.lifetimeValue - a.lifetimeValue);

      // VIP = top 10%
      const vipCutoff = Math.max(1, Math.ceil(customers.length * 0.1));
      const vipThreshold = customers[vipCutoff - 1]?.lifetimeValue ?? 0;
      customers.forEach(c => {
        c.isVip = c.lifetimeValue >= vipThreshold && vipThreshold > 0;
      });

      return {
        customers: customers.slice(0, limit),
        vipThreshold,
        totalCustomers: customers.length,
        totalValue: customers.reduce((a, b) => a + b.lifetimeValue, 0),
      };
    },
  });
}
