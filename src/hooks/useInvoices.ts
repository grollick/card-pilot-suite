import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type InvoiceStatus = "draft" | "sent" | "viewed" | "paid" | "overdue" | "cancelled";

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Draft", sent: "Sent", viewed: "Viewed",
  paid: "Paid", overdue: "Overdue", cancelled: "Cancelled",
};

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-primary/10 text-primary",
  viewed: "bg-warning/10 text-warning",
  paid: "bg-success/10 text-success",
  overdue: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};

export function generateInvoiceNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `INV-${y}${m}-${rand}`;
}

export function useInvoices(statusFilter?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["invoices", statusFilter],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase
        .from("invoices")
        .select("*, leads(name, email, phone, company), jobs(title, job_number)")
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

export function useInvoice(id?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["invoice", id],
    enabled: !!user && !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, leads(name, email, phone, company), jobs(title, job_number)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as any;
    },
  });
}

export function useInvoiceLineItems(invoiceId?: string) {
  return useQuery({
    queryKey: ["invoice-line-items", invoiceId],
    enabled: !!invoiceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoice_line_items")
        .select("*")
        .eq("invoice_id", invoiceId!)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function useCreateInvoice() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (invoice: {
      job_id?: string | null; lead_id?: string | null;
      invoice_number?: string; due_date?: string;
      subtotal?: number; tax_total?: number; discount_amount?: number;
      grand_total?: number; notes?: string; terms?: string;
      line_items?: Array<{ title: string; description?: string; quantity: number; unit_price: number; line_total: number }>;
    }) => {
      const { line_items, ...invoiceData } = invoice;
      const invNumber = invoiceData.invoice_number || generateInvoiceNumber();
      const { data, error } = await supabase
        .from("invoices")
        .insert({
          ...invoiceData,
          invoice_number: invNumber,
          user_id: user!.id,
          status: "draft" as any,
        })
        .select()
        .single();
      if (error) throw error;

      if (line_items?.length) {
        const { error: liError } = await supabase
          .from("invoice_line_items")
          .insert(line_items.map((li, i) => ({
            invoice_id: (data as any).id,
            title: li.title,
            description: li.description || null,
            quantity: li.quantity,
            unit_price: li.unit_price,
            line_total: li.line_total,
            sort_order: i,
          })));
        if (liError) throw liError;
      }

      // Log CRM activity
      if (invoice.lead_id) {
        await supabase.from("contact_activities").insert({
          lead_id: invoice.lead_id,
          user_id: user!.id,
          activity_type: "invoice_created",
          title: `Invoice ${invNumber} created`,
          related_id: (data as any).id,
        });
      }

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["contact-activities"] });
      toast.success("Invoice created");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase
        .from("invoices")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
      return { id };
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["invoice", vars.id] });
      toast.success("Invoice updated");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateInvoiceStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: InvoiceStatus }) => {
      const updates: any = { status };
      if (status === "sent") updates.sent_at = new Date().toISOString();
      if (status === "paid") {
        updates.paid_at = new Date().toISOString();
      }
      const { error } = await supabase.from("invoices").update(updates).eq("id", id);
      if (error) throw error;
      return { id, status };
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["invoice", vars.id] });
      toast.success(`Invoice marked as ${INVOICE_STATUS_LABELS[vars.status]}`);
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useCreateInvoiceFromJob() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ jobId, leadId, title, grandTotal }: {
      jobId: string; leadId?: string | null; title: string; grandTotal: number;
    }) => {
      const invoiceNumber = generateInvoiceNumber();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      const { data, error } = await supabase
        .from("invoices")
        .insert({
          user_id: user!.id,
          job_id: jobId,
          lead_id: leadId ?? null,
          invoice_number: invoiceNumber,
          status: "draft" as any,
          due_date: dueDate.toISOString().split("T")[0],
          subtotal: grandTotal,
          grand_total: grandTotal,
        })
        .select()
        .single();
      if (error) throw error;

      // Add a single line item for the job
      await supabase.from("invoice_line_items").insert({
        invoice_id: (data as any).id,
        title,
        quantity: 1,
        unit_price: grandTotal,
        line_total: grandTotal,
        sort_order: 0,
      });

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice generated from job");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// Save/replace all line items for an invoice
export function useSaveInvoiceLineItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ invoiceId, items }: {
      invoiceId: string;
      items: Array<{ title: string; description?: string; quantity: number; unit_price: number; line_total: number }>;
    }) => {
      // Delete existing
      await supabase.from("invoice_line_items").delete().eq("invoice_id", invoiceId);
      // Insert new
      if (items.length) {
        const { error } = await supabase.from("invoice_line_items").insert(
          items.map((li, i) => ({
            invoice_id: invoiceId,
            title: li.title,
            description: li.description || null,
            quantity: li.quantity,
            unit_price: li.unit_price,
            line_total: li.line_total,
            sort_order: i,
          }))
        );
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["invoice-line-items", vars.invoiceId] });
    },
    onError: (e: any) => toast.error(e.message),
  });
}
