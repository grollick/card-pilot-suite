import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const EXPENSE_CATEGORIES = [
  { value: "materials", label: "Materials" },
  { value: "labor", label: "Labor" },
  { value: "equipment", label: "Equipment" },
  { value: "fuel", label: "Fuel / Travel" },
  { value: "subcontractor", label: "Subcontractor" },
  { value: "permits", label: "Permits / Fees" },
  { value: "tools", label: "Tools" },
  { value: "office", label: "Office / Admin" },
  { value: "other", label: "Other" },
] as const;

export interface Expense {
  id: string;
  user_id: string;
  org_id: string | null;
  job_id: string | null;
  category: string;
  description: string;
  amount: number;
  date: string;
  receipt_url: string | null;
  vendor: string | null;
  is_billable: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useExpenses(jobId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["expenses", user?.id, jobId],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase
        .from("expenses" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("date", { ascending: false });
      if (jobId) q = q.eq("job_id", jobId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as Expense[];
    },
  });
}

export function useCreateExpense() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (expense: Partial<Expense>) => {
      const { error } = await supabase.from("expenses" as any).insert({
        ...expense,
        user_id: user!.id,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense added");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expenses" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useExpenseSummary() {
  const { data: expenses = [] } = useExpenses();
  const totalSpent = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const billable = expenses.filter((e) => e.is_billable).reduce((s, e) => s + Number(e.amount), 0);
  const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
    return acc;
  }, {});
  return { totalSpent, billable, byCategory, count: expenses.length };
}
