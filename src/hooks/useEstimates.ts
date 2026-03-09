import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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

export function calculateLineTotals(item: Omit<EstimateLineItem, "line_total">): EstimateLineItem {
  const laborCost = (item.labor_hours || 0) * (item.labor_rate || 0);
  const materialCost = item.material_cost || 0;
  const baseCost = (item.quantity || 1) * (item.unit_price || 0) + laborCost + materialCost;
  const markup = baseCost * ((item.markup_percent || 0) / 100);
  const subtotalBeforeTax = baseCost + markup;
  const tax = subtotalBeforeTax * ((item.tax_percent || 0) / 100);
  return { ...item, line_total: Math.round((subtotalBeforeTax + tax) * 100) / 100 };
}

export function calculateEstimateTotals(items: EstimateLineItem[]) {
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
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    labor_total: Math.round(labor_total * 100) / 100,
    material_total: Math.round(material_total * 100) / 100,
    markup_total: Math.round(markup_total * 100) / 100,
    tax_total: Math.round(tax_total * 100) / 100,
    grand_total: Math.round(grand_total * 100) / 100,
  };
}

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
      return data;
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
        const rows = line_items.map((li, i) => ({
          ...li,
          estimate_id: estimate.id,
          sort_order: i,
          line_total: calculateLineTotals(li).line_total,
        }));
        // Remove client-side id if present
        const cleaned = rows.map(({ id, ...r }) => r);
        const { error: liError } = await supabase.from("estimate_line_items").insert(cleaned);
        if (liError) throw liError;
      }

      // Log activity if linked to a contact
      if (form.lead_id) {
        await supabase.from("contact_activities").insert({
          lead_id: form.lead_id,
          user_id: user!.id,
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
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...form }: EstimateFormData & { id: string }) => {
      const totals = calculateEstimateTotals(form.line_items);
      const { line_items, ...rest } = form;
      const { error } = await supabase
        .from("estimates")
        .update({ ...rest, ...totals })
        .eq("id", id);
      if (error) throw error;

      // Replace line items
      await supabase.from("estimate_line_items").delete().eq("estimate_id", id);
      if (line_items.length > 0) {
        const rows = line_items.map((li, i) => ({
          ...li,
          estimate_id: id,
          sort_order: i,
          line_total: calculateLineTotals(li).line_total,
        }));
        const cleaned = rows.map(({ id: _id, ...r }) => r);
        const { error: liError } = await supabase.from("estimate_line_items").insert(cleaned);
        if (liError) throw liError;
      }
      return { id };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["estimates"] });
      qc.invalidateQueries({ queryKey: ["estimate"] });
      toast.success("Estimate updated");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateEstimateStatus() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, lead_id, estimate_number }: { id: string; status: EstimateStatus; lead_id?: string | null; estimate_number?: string }) => {
      const { error } = await supabase.from("estimates").update({ status }).eq("id", id);
      if (error) throw error;

      if (lead_id) {
        await supabase.from("contact_activities").insert({
          lead_id,
          user_id: user!.id,
          activity_type: `estimate_${status}`,
          title: `Estimate ${estimate_number ?? ""} ${status}`,
          related_id: id,
        });
      }
      return { id, status };
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["estimates"] });
      qc.invalidateQueries({ queryKey: ["estimate"] });
      qc.invalidateQueries({ queryKey: ["contact-activities"] });
      toast.success(`Estimate marked as ${vars.status}`);
    },
    onError: (e: any) => toast.error(e.message),
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

export function generateEstimateNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `EST-${y}${m}-${rand}`;
}

// ── Trades templates ──
export interface TradesTemplate {
  key: string;
  name: string;
  defaultJobType: string;
  lineItems: Omit<EstimateLineItem, "line_total" | "sort_order">[];
}

export const TRADES_TEMPLATES: TradesTemplate[] = [
  {
    key: "general_contractor",
    name: "General Contractor",
    defaultJobType: "Renovation",
    lineItems: [
      { title: "Demolition", description: "Removal of existing structures", quantity: 1, unit: "job", unit_price: 0, labor_hours: 8, labor_rate: 65, material_cost: 200, markup_percent: 15, tax_percent: 0 },
      { title: "Framing", description: "New wall framing", quantity: 1, unit: "job", unit_price: 0, labor_hours: 16, labor_rate: 65, material_cost: 800, markup_percent: 15, tax_percent: 0 },
      { title: "Drywall", description: "Install and finish drywall", quantity: 1, unit: "job", unit_price: 0, labor_hours: 12, labor_rate: 55, material_cost: 400, markup_percent: 15, tax_percent: 0 },
    ],
  },
  {
    key: "plumber",
    name: "Plumber",
    defaultJobType: "Plumbing Repair",
    lineItems: [
      { title: "Diagnostic / Inspection", description: "On-site assessment", quantity: 1, unit: "visit", unit_price: 95, labor_hours: 1, labor_rate: 0, material_cost: 0, markup_percent: 0, tax_percent: 0 },
      { title: "Pipe Repair", description: "Replace damaged section", quantity: 1, unit: "job", unit_price: 0, labor_hours: 3, labor_rate: 85, material_cost: 120, markup_percent: 10, tax_percent: 0 },
      { title: "Fixture Installation", description: "Install new fixture", quantity: 1, unit: "each", unit_price: 0, labor_hours: 2, labor_rate: 85, material_cost: 250, markup_percent: 10, tax_percent: 0 },
    ],
  },
  {
    key: "electrician",
    name: "Electrician",
    defaultJobType: "Electrical Work",
    lineItems: [
      { title: "Panel Inspection", quantity: 1, unit: "visit", unit_price: 120, labor_hours: 1, labor_rate: 0, material_cost: 0, markup_percent: 0, tax_percent: 0 },
      { title: "Outlet Installation", quantity: 4, unit: "each", unit_price: 0, labor_hours: 0.5, labor_rate: 90, material_cost: 25, markup_percent: 10, tax_percent: 0 },
      { title: "Wiring Run", quantity: 1, unit: "job", unit_price: 0, labor_hours: 6, labor_rate: 90, material_cost: 350, markup_percent: 10, tax_percent: 0 },
    ],
  },
  {
    key: "painter",
    name: "Painter",
    defaultJobType: "Interior Painting",
    lineItems: [
      { title: "Surface Preparation", quantity: 1, unit: "job", unit_price: 0, labor_hours: 4, labor_rate: 45, material_cost: 60, markup_percent: 10, tax_percent: 0 },
      { title: "Primer Coat", quantity: 1, unit: "job", unit_price: 0, labor_hours: 3, labor_rate: 45, material_cost: 80, markup_percent: 10, tax_percent: 0 },
      { title: "Finish Coats (2x)", quantity: 1, unit: "job", unit_price: 0, labor_hours: 6, labor_rate: 45, material_cost: 120, markup_percent: 10, tax_percent: 0 },
    ],
  },
  {
    key: "landscaper",
    name: "Landscaper",
    defaultJobType: "Landscaping",
    lineItems: [
      { title: "Site Cleanup", quantity: 1, unit: "job", unit_price: 0, labor_hours: 4, labor_rate: 40, material_cost: 0, markup_percent: 10, tax_percent: 0 },
      { title: "Planting", quantity: 10, unit: "plants", unit_price: 25, labor_hours: 0.5, labor_rate: 40, material_cost: 0, markup_percent: 10, tax_percent: 0 },
      { title: "Mulch & Topsoil", quantity: 5, unit: "yards", unit_price: 45, labor_hours: 0, labor_rate: 0, material_cost: 0, markup_percent: 10, tax_percent: 0 },
    ],
  },
  {
    key: "cleaner",
    name: "Cleaner",
    defaultJobType: "Deep Clean",
    lineItems: [
      { title: "General Cleaning", quantity: 1, unit: "job", unit_price: 0, labor_hours: 4, labor_rate: 35, material_cost: 30, markup_percent: 0, tax_percent: 0 },
      { title: "Window Cleaning", quantity: 1, unit: "job", unit_price: 0, labor_hours: 2, labor_rate: 35, material_cost: 15, markup_percent: 0, tax_percent: 0 },
    ],
  },
  {
    key: "roofer",
    name: "Roofer",
    defaultJobType: "Roof Repair",
    lineItems: [
      { title: "Roof Inspection", quantity: 1, unit: "visit", unit_price: 150, labor_hours: 1, labor_rate: 0, material_cost: 0, markup_percent: 0, tax_percent: 0 },
      { title: "Shingle Replacement", quantity: 1, unit: "sq", unit_price: 0, labor_hours: 4, labor_rate: 75, material_cost: 250, markup_percent: 15, tax_percent: 0 },
      { title: "Flashing Repair", quantity: 1, unit: "job", unit_price: 0, labor_hours: 2, labor_rate: 75, material_cost: 80, markup_percent: 15, tax_percent: 0 },
    ],
  },
  {
    key: "flooring",
    name: "Flooring Installer",
    defaultJobType: "Flooring Installation",
    lineItems: [
      { title: "Floor Removal", quantity: 1, unit: "job", unit_price: 0, labor_hours: 4, labor_rate: 50, material_cost: 0, markup_percent: 10, tax_percent: 0 },
      { title: "Subfloor Prep", quantity: 1, unit: "job", unit_price: 0, labor_hours: 2, labor_rate: 50, material_cost: 100, markup_percent: 10, tax_percent: 0 },
      { title: "Flooring Install", description: "LVP / Hardwood / Tile", quantity: 200, unit: "sqft", unit_price: 4.5, labor_hours: 0, labor_rate: 0, material_cost: 0, markup_percent: 10, tax_percent: 0 },
    ],
  },
  {
    key: "hvac",
    name: "HVAC",
    defaultJobType: "HVAC Service",
    lineItems: [
      { title: "System Diagnostic", quantity: 1, unit: "visit", unit_price: 125, labor_hours: 1, labor_rate: 0, material_cost: 0, markup_percent: 0, tax_percent: 0 },
      { title: "Refrigerant Recharge", quantity: 1, unit: "job", unit_price: 0, labor_hours: 1, labor_rate: 95, material_cost: 200, markup_percent: 15, tax_percent: 0 },
      { title: "Filter & Coil Cleaning", quantity: 1, unit: "job", unit_price: 0, labor_hours: 1.5, labor_rate: 95, material_cost: 40, markup_percent: 10, tax_percent: 0 },
    ],
  },
  {
    key: "handyman",
    name: "Handyman",
    defaultJobType: "General Repair",
    lineItems: [
      { title: "Service Call", quantity: 1, unit: "visit", unit_price: 75, labor_hours: 0, labor_rate: 0, material_cost: 0, markup_percent: 0, tax_percent: 0 },
      { title: "Repair Work", quantity: 1, unit: "hr", unit_price: 0, labor_hours: 2, labor_rate: 55, material_cost: 50, markup_percent: 10, tax_percent: 0 },
    ],
  },
];
