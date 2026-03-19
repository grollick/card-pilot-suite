import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useInvoicePayments(invoiceId?: string) {
  return useQuery({
    queryKey: ["invoice-payments", invoiceId],
    enabled: !!invoiceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoice_payments")
        .select("*")
        .eq("invoice_id", invoiceId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function useRecordPayment() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      invoiceId,
      amount,
      paymentMethod,
      paymentReference,
      notes,
      leadId,
      invoiceNumber,
      grandTotal,
    }: {
      invoiceId: string;
      amount: number;
      paymentMethod: string;
      paymentReference?: string;
      notes?: string;
      leadId?: string | null;
      invoiceNumber?: string;
      grandTotal: number;
    }) => {
      // Insert payment record
      const { error: payError } = await supabase
        .from("invoice_payments")
        .insert({
          invoice_id: invoiceId,
          user_id: user!.id,
          amount,
          payment_method: paymentMethod,
          payment_reference: paymentReference || null,
          notes: notes || null,
        });
      if (payError) throw payError;

      // Calculate new amount_paid
      const newAmountPaid = amount; // Phase 1: full payment only
      const isFullyPaid = newAmountPaid >= grandTotal;

      // Update invoice
      const updates: any = {
        amount_paid: newAmountPaid,
        payment_method: paymentMethod,
        payment_reference: paymentReference || null,
      };
      if (isFullyPaid) {
        updates.status = "paid";
        updates.paid_at = new Date().toISOString();
      }

      const { error: invError } = await supabase
        .from("invoices")
        .update(updates)
        .eq("id", invoiceId);
      if (invError) throw invError;

      // Log CRM activity
      if (leadId && user) {
        await supabase.from("contact_activities").insert({
          lead_id: leadId,
          user_id: user.id,
          activity_type: "invoice_paid",
          title: `Payment of $${amount} recorded for invoice ${invoiceNumber ?? ""}`,
          related_id: invoiceId,
        });
      }

      return { invoiceId, isFullyPaid };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["invoice", result.invoiceId] });
      qc.invalidateQueries({ queryKey: ["invoice-payments", result.invoiceId] });
      qc.invalidateQueries({ queryKey: ["contact-activities"] });
      toast.success(result.isFullyPaid ? "Invoice marked as paid" : "Payment recorded");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useInvoicePaymentLink(invoiceId?: string) {
  return useQuery({
    queryKey: ["invoice-payment-link", invoiceId],
    enabled: !!invoiceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("payment_token")
        .eq("id", invoiceId!)
        .single();
      if (error) throw error;
      const token = (data as any)?.payment_token;
      if (!token) return null;
      return `${window.location.origin}/pay/${token}`;
    },
  });
}
