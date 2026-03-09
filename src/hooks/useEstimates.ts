import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { CalcMode } from "@/lib/estimateCalculators";

// ── Types ──

export type EstimateStatus = "draft" | "sent" | "viewed" | "approved" | "declined" | "expired";

export interface EstimateLineItem {
  id?: string;
  estimate_id?: string;
  section_id?: string | null;
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
  calc_mode: CalcMode;
  calc_length: number;
  calc_width: number;
  calc_depth: number;
  is_optional: boolean;
}

export interface EstimateSection {
  _tempId?: string;
  id?: string;
  estimate_id?: string;
  name: string;
  notes?: string;
  sort_order: number;
  items: EstimateLineItem[];
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
  discount_amount?: number;
  discount_percent?: number;
  deposit_percent?: number;
  deposit_amount?: number;
  terms_conditions?: string;
  internal_notes?: string;
  sections: EstimateSection[];
}

export interface EstimateTotals {
  subtotal: number;
  labor_total: number;
  material_total: number;
  markup_total: number;
  discount_total: number;
  tax_total: number;
  grand_total: number;
  deposit_due: number;
  balance_due: number;
  optional_total: number;
}

// ── Calculation helpers ──

export function calculateLineTotals(item: Omit<EstimateLineItem, "line_total"> & { line_total?: number }): EstimateLineItem {
  const laborCost = (item.labor_hours || 0) * (item.labor_rate || 0);
  const materialCost = item.material_cost || 0;
  const baseCost = (item.quantity || 1) * (item.unit_price || 0) + laborCost + materialCost;
  const markup = baseCost * ((item.markup_percent || 0) / 100);
  const subtotalBeforeTax = baseCost + markup;
  const tax = subtotalBeforeTax * ((item.tax_percent || 0) / 100);
  return { ...item, line_total: Math.round((subtotalBeforeTax + tax) * 100) / 100 } as EstimateLineItem;
}

export function calculateEstimateTotals(
  sections: EstimateSection[],
  opts?: { discount_amount?: number; discount_percent?: number; deposit_amount?: number; deposit_percent?: number },
): EstimateTotals {
  let subtotal = 0, labor_total = 0, material_total = 0, markup_total = 0, tax_total = 0, optional_total = 0;

  for (const section of sections) {
    for (const item of section.items) {
      const qty = item.quantity || 1;
      const base = qty * (item.unit_price || 0);
      const labor = (item.labor_hours || 0) * (item.labor_rate || 0);
      const mat = item.material_cost || 0;
      const lineBase = base + labor + mat;
      const markup = lineBase * ((item.markup_percent || 0) / 100);
      const preTax = lineBase + markup;
      const tax = preTax * ((item.tax_percent || 0) / 100);

      if (item.is_optional) {
        optional_total += preTax + tax;
        continue; // optional items don't count in totals
      }

      subtotal += base;
      labor_total += labor;
      material_total += mat;
      markup_total += markup;
      tax_total += tax;
    }
  }

  const preDiscount = subtotal + labor_total + material_total + markup_total + tax_total;
  const discAmt = opts?.discount_amount || 0;
  const discPct = opts?.discount_percent || 0;
  const discount_total = discAmt + preDiscount * (discPct / 100);
  const grand_total = Math.max(0, preDiscount - discount_total);
  const depAmt = opts?.deposit_amount || 0;
  const depPct = opts?.deposit_percent || 0;
  const deposit_due = depAmt > 0 ? depAmt : grand_total * (depPct / 100);
  const balance_due = grand_total - deposit_due;

  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    subtotal: round(subtotal), labor_total: round(labor_total), material_total: round(material_total),
    markup_total: round(markup_total), discount_total: round(discount_total), tax_total: round(tax_total),
    grand_total: round(grand_total), deposit_due: round(deposit_due), balance_due: round(balance_due),
    optional_total: round(optional_total),
  };
}

/** Flat helper for backward compat (flat item list → single section) */
export function calculateEstimateTotalsFlat(items: EstimateLineItem[], opts?: Parameters<typeof calculateEstimateTotals>[1]): EstimateTotals {
  return calculateEstimateTotals([{ name: "General", sort_order: 0, items }], opts);
}

/** Strip client-side fields that shouldn't go to the DB */
function cleanLineItemForDB(li: EstimateLineItem, estimateId: string, idx: number, sectionId?: string | null) {
  const { id: _id, estimate_id: _eid, ...rest } = li;
  return {
    ...rest,
    estimate_id: estimateId,
    section_id: sectionId ?? null,
    sort_order: idx,
    line_total: calculateLineTotals(rest).line_total,
  };
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

      // Fetch sections separately
      const { data: sections } = await supabase
        .from("estimate_sections" as any)
        .select("*")
        .eq("estimate_id", id!)
        .order("sort_order");

      return { ...data, estimate_sections: sections ?? [] };
    },
  });
}

export function useCreateEstimate() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: EstimateFormData) => {
      const totals = calculateEstimateTotals(form.sections, {
        discount_amount: form.discount_amount, discount_percent: form.discount_percent,
        deposit_amount: form.deposit_amount, deposit_percent: form.deposit_percent,
      });
      const { sections, ...rest } = form;
      const { data: estimate, error } = await supabase
        .from("estimates")
        .insert({
          ...rest, ...totals, user_id: user!.id,
          discount_amount: form.discount_amount ?? 0,
          discount_percent: form.discount_percent ?? 0,
          deposit_amount: form.deposit_amount ?? 0,
          deposit_percent: form.deposit_percent ?? 0,
          terms_conditions: form.terms_conditions ?? null,
          internal_notes: form.internal_notes ?? null,
        } as any)
        .select()
        .single();
      if (error) throw error;

      // Create sections and line items
      for (let si = 0; si < sections.length; si++) {
        const sec = sections[si];
        let sectionId: string | null = null;

        if (sections.length > 1 || sec.name !== "General") {
          const { data: secData, error: secErr } = await supabase
            .from("estimate_sections" as any)
            .insert({ estimate_id: estimate.id, name: sec.name, notes: sec.notes ?? null, sort_order: si } as any)
            .select()
            .single();
          if (secErr) throw secErr;
          sectionId = (secData as any).id;
        }

        if (sec.items.length > 0) {
          const cleaned = sec.items.map((li, i) => cleanLineItemForDB(li, estimate.id, i, sectionId));
          const { error: liError } = await supabase.from("estimate_line_items").insert(cleaned as any);
          if (liError) throw liError;
        }
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
      const totals = calculateEstimateTotals(form.sections, {
        discount_amount: form.discount_amount, discount_percent: form.discount_percent,
        deposit_amount: form.deposit_amount, deposit_percent: form.deposit_percent,
      });
      const { sections, ...rest } = form;
      const { error } = await supabase.from("estimates").update({
        ...rest, ...totals,
        discount_amount: form.discount_amount ?? 0,
        discount_percent: form.discount_percent ?? 0,
        deposit_amount: form.deposit_amount ?? 0,
        deposit_percent: form.deposit_percent ?? 0,
        terms_conditions: form.terms_conditions ?? null,
        internal_notes: form.internal_notes ?? null,
      } as any).eq("id", id);
      if (error) throw error;

      // Replace sections and line items atomically
      await supabase.from("estimate_line_items").delete().eq("estimate_id", id);
      await supabase.from("estimate_sections" as any).delete().eq("estimate_id", id);

      for (let si = 0; si < sections.length; si++) {
        const sec = sections[si];
        let sectionId: string | null = null;

        if (sections.length > 1 || sec.name !== "General") {
          const { data: secData, error: secErr } = await supabase
            .from("estimate_sections" as any)
            .insert({ estimate_id: id, name: sec.name, notes: sec.notes ?? null, sort_order: si } as any)
            .select()
            .single();
          if (secErr) throw secErr;
          sectionId = (secData as any).id;
        }

        if (sec.items.length > 0) {
          const cleaned = sec.items.map((li, i) => cleanLineItemForDB(li, id, i, sectionId));
          const { error: liError } = await supabase.from("estimate_line_items").insert(cleaned as any);
          if (liError) throw liError;
        }
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
      updatePipelineStage?: { stageId: string } | null;
    }) => {
      const extra: Record<string, any> = { status };
      if (status === "approved") extra.approved_at = new Date().toISOString();
      if (status === "declined") extra.declined_at = new Date().toISOString();

      const { error } = await supabase.from("estimates").update(extra as any).eq("id", id);
      if (error) throw error;

      if (lead_id) {
        await supabase.from("contact_activities").insert({
          lead_id, user_id: user!.id,
          activity_type: `estimate_${status}`,
          title: `Estimate ${estimate_number ?? ""} ${status}`,
          related_id: id,
        });
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

export function useConvertEstimateToJob() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ estimateId, leadId, estimateNumber, startDatetime, endDatetime, serviceId }: {
      estimateId: string;
      leadId?: string | null;
      estimateNumber: string;
      startDatetime: string;
      endDatetime: string;
      serviceId?: string | null;
    }) => {
      // Create booking
      const { data: booking, error } = await supabase.from("bookings").insert({
        user_id: user!.id,
        lead_id: leadId ?? null,
        service_id: serviceId ?? null,
        customer_name: "From Estimate",
        start_datetime: startDatetime,
        end_datetime: endDatetime,
        status: "confirmed",
        internal_notes: `Created from estimate ${estimateNumber}`,
      } as any).select().single();
      if (error) throw error;

      // Link booking to estimate
      await supabase.from("estimates").update({ converted_booking_id: booking.id, status: "approved" } as any).eq("id", estimateId);

      // Log activity
      if (leadId) {
        await supabase.from("contact_activities").insert({
          lead_id: leadId, user_id: user!.id,
          activity_type: "estimate_converted",
          title: `Estimate ${estimateNumber} converted to job`,
          related_id: estimateId,
        });
      }
      return booking;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["estimates"] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["contact-activities"] });
      toast.success("Estimate converted to job");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDuplicateEstimate() {
  const createEstimate = useCreateEstimate();
  return useMutation({
    mutationFn: async (est: any) => {
      const { data: items } = await supabase
        .from("estimate_line_items")
        .select("*")
        .eq("estimate_id", est.id)
        .order("sort_order");

      const { data: sections } = await supabase
        .from("estimate_sections" as any)
        .select("*")
        .eq("estimate_id", est.id)
        .order("sort_order");

      const sectionsList = (sections ?? []) as any[];
      const itemsList = (items ?? []) as any[];

      // Reconstruct sections with items
      let formSections: EstimateSection[];
      if (sectionsList.length > 0) {
        formSections = sectionsList.map((s: any, si: number) => ({
          name: s.name,
          notes: s.notes,
          sort_order: si,
          items: itemsList
            .filter((li: any) => li.section_id === s.id)
            .map((li: any) => ({ ...li, id: undefined, estimate_id: undefined, section_id: undefined })),
        }));
        // Items without section
        const unsectioned = itemsList.filter((li: any) => !li.section_id);
        if (unsectioned.length > 0) {
          formSections.push({ name: "General", sort_order: formSections.length, items: unsectioned.map((li: any) => ({ ...li, id: undefined, estimate_id: undefined, section_id: undefined })) });
        }
      } else {
        formSections = [{ name: "General", sort_order: 0, items: itemsList.map((li: any) => ({ ...li, id: undefined, estimate_id: undefined, section_id: undefined })) }];
      }

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
        discount_amount: est.discount_amount,
        discount_percent: est.discount_percent,
        deposit_amount: est.deposit_amount,
        deposit_percent: est.deposit_percent,
        terms_conditions: est.terms_conditions,
        internal_notes: est.internal_notes,
        sections: formSections,
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
