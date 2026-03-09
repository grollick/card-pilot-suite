import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ── Types ──

export type EstimateStatus = "draft" | "sent" | "viewed" | "approved" | "declined" | "expired";

export interface EstimateLineItem {
  id?: string;
  estimate_id?: string;
  title: string;
  description?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  labor_hours: number;
  labor_rate: number;
  material_cost: number;
  markup_percent: number;
  tax_percent: number;
  line_total: number;
  sort_order: number;
}

export interface EstimateFormData {
  lead_id?: string | null;
  booking_id?: string | null;
  estimate_number: string;
  status: EstimateStatus;
  issue_date: string;
  expiry_date?: string | null;
  job_address?: string;
  job_type?: string;
  scope_of_work?: string;
  notes?: string;
  template_key?: string;
  line_items: EstimateLineItem[];
}

export interface EstimateTotals {
  subtotal: number;
  labor_total: number;
  material_total: number;
  markup_total: number;
  tax_total: number;
  grand_total: number;
}

// ── Calculation helpers ──

export function calculateLineTotals(item: Omit<EstimateLineItem, "line_total"> & { line_total?: number }): EstimateLineItem {
  const laborCost = (item.labor_hours || 0) * (item.labor_rate || 0);
  const materialCost = item.material_cost || 0;
  const baseCost = (item.quantity || 1) * (item.unit_price || 0) + laborCost + materialCost;
  const markup = baseCost * ((item.markup_percent || 0) / 100);
  const subtotalBeforeTax = baseCost + markup;
  const tax = subtotalBeforeTax * ((item.tax_percent || 0) / 100);
  return { ...item, line_total: Math.round((subtotalBeforeTax + tax) * 100) / 100 };
}

export function calculateEstimateTotals(items: EstimateLineItem[]): EstimateTotals {
  let subtotal = 0, labor_total = 0, material_total = 0, markup_total = 0, tax_total = 0;
  for (const item of items) {
    const qty = item.quantity || 1;
    const base = qty * (item.unit_price || 0);
    const labor = (item.labor_hours || 0) * (item.labor_rate || 0);
    const mat = item.material_cost || 0;
    const lineBase = base + labor + mat;
    const markup = lineBase * ((item.markup_percent || 0) / 100);
    const preTax = lineBase + markup;
    const tax = preTax * ((item.tax_percent || 0) / 100);
    subtotal += base;
    labor_total += labor;
    material_total += mat;
    markup_total += markup;
    tax_total += tax;
  }
  const grand_total = subtotal + labor_total + material_total + markup_total + tax_total;
  const round = (n: number) => Math.round(n * 100) / 100;
  return { subtotal: round(subtotal), labor_total: round(labor_total), material_total: round(material_total), markup_total: round(markup_total), tax_total: round(tax_total), grand_total: round(grand_total) };
}

/** Strip client-side fields that shouldn't go to the DB */
function cleanLineItemForDB(li: EstimateLineItem, estimateId: string, idx: number) {
  const { id: _id, estimate_id: _eid, ...rest } = li;
  return { ...rest, estimate_id: estimateId, sort_order: idx, line_total: calculateLineTotals(rest).line_total };
}

// ── Estimate number generator ──

export function generateEstimateNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `EST-${y}${m}-${rand}`;
}

// ── Hooks ──

export function useEstimates() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["estimates"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estimates")
        .select("*, leads(name, email, phone)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useEstimate(id?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["estimate", id],
    enabled: !!user && !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estimates")
        .select("*, leads(name, email, phone, company), estimate_line_items(*)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateEstimate() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: EstimateFormData) => {
      const totals = calculateEstimateTotals(form.line_items);
      const { line_items, ...rest } = form;
      const { data: estimate, error } = await supabase
        .from("estimates")
        .insert({ ...rest, ...totals, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;

      if (line_items.length > 0) {
        const cleaned = line_items.map((li, i) => cleanLineItemForDB(li, estimate.id, i));
        const { error: liError } = await supabase.from("estimate_line_items").insert(cleaned);
        if (liError) throw liError;
      }

      if (form.lead_id) {
        await supabase.from("contact_activities").insert({
          lead_id: form.lead_id, user_id: user!.id,
          activity_type: "estimate_created",
          title: `Estimate ${form.estimate_number} created`,
          related_id: estimate.id,
        });
      }
      return estimate;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["estimates"] });
      qc.invalidateQueries({ queryKey: ["contact-activities"] });
      toast.success("Estimate created");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateEstimate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...form }: EstimateFormData & { id: string }) => {
      const totals = calculateEstimateTotals(form.line_items);
      const { line_items, ...rest } = form;
      const { error } = await supabase.from("estimates").update({ ...rest, ...totals }).eq("id", id);
      if (error) throw error;

      // Replace line items atomically
      await supabase.from("estimate_line_items").delete().eq("estimate_id", id);
      if (line_items.length > 0) {
        const cleaned = line_items.map((li, i) => cleanLineItemForDB(li, id, i));
        const { error: liError } = await supabase.from("estimate_line_items").insert(cleaned);
        if (liError) throw liError;
      }
      return { id };
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["estimates"] });
      qc.invalidateQueries({ queryKey: ["estimate", vars.id] });
      toast.success("Estimate updated");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateEstimateStatus() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id, status, lead_id, estimate_number, updatePipelineStage,
    }: {
      id: string;
      status: EstimateStatus;
      lead_id?: string | null;
      estimate_number?: string;
      /** Optional: move the contact to a specific pipeline stage */
      updatePipelineStage?: { stageId: string } | null;
    }) => {
      const { error } = await supabase.from("estimates").update({ status }).eq("id", id);
      if (error) throw error;

      if (lead_id) {
        // Log activity
        await supabase.from("contact_activities").insert({
          lead_id, user_id: user!.id,
          activity_type: `estimate_${status}`,
          title: `Estimate ${estimate_number ?? ""} ${status}`,
          related_id: id,
        });

        // Move pipeline stage if requested
        if (updatePipelineStage?.stageId) {
          await supabase.from("leads").update({ stage_id: updatePipelineStage.stageId }).eq("id", lead_id);
        }
      }
      return { id, status };
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["estimates"] });
      qc.invalidateQueries({ queryKey: ["estimate", vars.id] });
      qc.invalidateQueries({ queryKey: ["contact-activities"] });
      qc.invalidateQueries({ queryKey: ["contacts"] });
      qc.invalidateQueries({ queryKey: ["pipeline-stages"] });
      toast.success(`Estimate marked as ${vars.status}`);
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDuplicateEstimate() {
  const createEstimate = useCreateEstimate();
  return useMutation({
    mutationFn: async (est: any) => {
      // Fetch line items from original
      const { data: items } = await supabase
        .from("estimate_line_items")
        .select("*")
        .eq("estimate_id", est.id)
        .order("sort_order");

      return createEstimate.mutateAsync({
        lead_id: est.lead_id,
        booking_id: est.booking_id,
        estimate_number: generateEstimateNumber(),
        status: "draft",
        issue_date: new Date().toISOString().split("T")[0],
        expiry_date: est.expiry_date,
        job_address: est.job_address,
        job_type: est.job_type,
        scope_of_work: est.scope_of_work,
        notes: est.notes,
        template_key: est.template_key,
        line_items: (items ?? []).map((li: any) => ({
          title: li.title, description: li.description,
          quantity: li.quantity, unit: li.unit, unit_price: li.unit_price,
          labor_hours: li.labor_hours, labor_rate: li.labor_rate,
          material_cost: li.material_cost, markup_percent: li.markup_percent,
          tax_percent: li.tax_percent, line_total: li.line_total, sort_order: li.sort_order,
        })),
      });
    },
  });
}

export function useDeleteEstimate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("estimates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["estimates"] });
      toast.success("Estimate deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });
}
