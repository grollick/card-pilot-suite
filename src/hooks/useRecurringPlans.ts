import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { addDays, addWeeks, addMonths, nextDay, format } from "date-fns";

export type RecurringPlanStatus = "active" | "paused" | "cancelled" | "completed";
export type RecurringFrequency = "weekly" | "biweekly" | "monthly" | "quarterly" | "custom";
export type RecurringBillingCycle = "per_visit" | "monthly" | "custom";

export const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  weekly: "Weekly", biweekly: "Every 2 Weeks", monthly: "Monthly",
  quarterly: "Quarterly", custom: "Custom",
};

export const BILLING_CYCLE_LABELS: Record<RecurringBillingCycle, string> = {
  per_visit: "Per Visit", monthly: "Monthly", custom: "Custom",
};

export const PLAN_STATUS_LABELS: Record<RecurringPlanStatus, string> = {
  active: "Active", paused: "Paused", cancelled: "Cancelled", completed: "Completed",
};

export const PLAN_STATUS_COLORS: Record<RecurringPlanStatus, string> = {
  active: "bg-success/10 text-success",
  paused: "bg-warning/10 text-warning",
  cancelled: "bg-destructive/10 text-destructive",
  completed: "bg-muted text-muted-foreground",
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function getScheduleSummary(
  frequency: RecurringFrequency,
  startDate: string,
  preferredDay?: number | null,
  customIntervalDays?: number | null,
): string {
  const start = new Date(startDate);
  const dayName = preferredDay != null ? DAY_NAMES[preferredDay] : format(start, "EEEE");
  const startStr = format(start, "MMM d");
  switch (frequency) {
    case "weekly": return `Every week on ${dayName} starting ${startStr}`;
    case "biweekly": return `Every 2 weeks on ${dayName} starting ${startStr}`;
    case "monthly": return `Monthly on the ${format(start, "do")} starting ${startStr}`;
    case "quarterly": return `Every 3 months starting ${startStr}`;
    case "custom": return `Every ${customIntervalDays ?? 30} days starting ${startStr}`;
  }
}

export function calculateNextServiceDate(
  frequency: RecurringFrequency,
  fromDate: Date,
  customIntervalDays?: number | null,
): Date {
  switch (frequency) {
    case "weekly": return addWeeks(fromDate, 1);
    case "biweekly": return addWeeks(fromDate, 2);
    case "monthly": return addMonths(fromDate, 1);
    case "quarterly": return addMonths(fromDate, 3);
    case "custom": return addDays(fromDate, customIntervalDays ?? 30);
  }
}

// ── Queries ──

export function useRecurringPlans(statusFilter?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["recurring-plans", statusFilter],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase
        .from("recurring_plans")
        .select("*, leads(name, email, phone, company)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (statusFilter && statusFilter !== "all") {
        q = q.eq("status", statusFilter as any);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function useRecurringPlan(id?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["recurring-plan", id],
    enabled: !!user && !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recurring_plans")
        .select("*, leads(name, email, phone, company)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as any;
    },
  });
}

// ── Mutations ──

export function useCreateRecurringPlan() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (plan: {
      lead_id?: string | null; job_id?: string | null;
      service_name: string; frequency: RecurringFrequency;
      custom_interval_days?: number; preferred_day_of_week?: number;
      billing_cycle?: RecurringBillingCycle;
      price: number; start_date: string; end_date?: string;
      notes?: string;
    }) => {
      const startDate = new Date(plan.start_date);
      const nextDate = calculateNextServiceDate(plan.frequency, startDate, plan.custom_interval_days);

      const { data, error } = await supabase
        .from("recurring_plans")
        .insert({
          ...plan,
          user_id: user!.id,
          status: "active" as any,
          next_service_date: plan.start_date,
        })
        .select()
        .single();
      if (error) throw error;

      // Log CRM activity
      if (plan.lead_id) {
        await supabase.from("contact_activities").insert({
          lead_id: plan.lead_id, user_id: user!.id,
          activity_type: "recurring_plan_created",
          title: `Recurring plan: ${plan.service_name} (${FREQUENCY_LABELS[plan.frequency]})`,
        });
      }

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recurring-plans"] });
      qc.invalidateQueries({ queryKey: ["contact-activities"] });
      toast.success("Recurring plan created");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateRecurringPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("recurring_plans").update(updates).eq("id", id);
      if (error) throw error;
      return { id };
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["recurring-plans"] });
      qc.invalidateQueries({ queryKey: ["recurring-plan", vars.id] });
      toast.success("Plan updated");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function usePausePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("recurring_plans")
        .update({ status: "paused" as any }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recurring-plans"] });
      toast.success("Plan paused");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useResumePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("recurring_plans")
        .update({ status: "active" as any }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recurring-plans"] });
      toast.success("Plan resumed");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useCancelPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("recurring_plans")
        .update({ status: "cancelled" as any }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recurring-plans"] });
      toast.success("Plan cancelled");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useSkipNextService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Get current plan to compute next date
      const { data: plan, error: fetchErr } = await supabase
        .from("recurring_plans").select("*").eq("id", id).single();
      if (fetchErr) throw fetchErr;

      const p = plan as any;
      const currentNext = new Date(p.next_service_date);
      const newNext = calculateNextServiceDate(p.frequency, currentNext, p.custom_interval_days);

      const { error } = await supabase.from("recurring_plans")
        .update({
          next_service_date: format(newNext, "yyyy-MM-dd"),
          skip_next: false,
        }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recurring-plans"] });
      toast.success("Next service skipped");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteRecurringPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("recurring_plans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recurring-plans"] });
      toast.success("Plan deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });
}
