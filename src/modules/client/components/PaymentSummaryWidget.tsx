import { motion } from "framer-motion";
import { CreditCard, Receipt, CheckCircle2, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  leadIds: string[];
}

export default function PaymentSummaryWidget({ leadIds }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["client-payment-summary", leadIds],
    enabled: leadIds.length > 0,
    queryFn: async () => {
      // Get invoices linked to client's leads
      const { data: invoices } = await supabase
        .from("invoices")
        .select("id, grand_total, status, amount_paid, payment_token")
        .in("lead_id", leadIds);

      if (!invoices?.length) return { total: 0, paid: 0, outstanding: 0, invoiceCount: 0, paidCount: 0 };

      const total = invoices.reduce((s, i) => s + Number(i.grand_total || 0), 0);
      const paid = invoices.reduce((s, i) => s + Number(i.amount_paid || 0), 0);
      const paidCount = invoices.filter(i => i.status === "paid").length;

      return {
        total,
        paid,
        outstanding: total - paid,
        invoiceCount: invoices.length,
        paidCount,
      };
    },
  });

  if (isLoading) return <Skeleton className="h-32 rounded-xl" />;
  if (!data || data.invoiceCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-5 space-y-4"
    >
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-primary" />
        Payment Summary
      </h3>

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-lg font-bold">${data.total.toLocaleString()}</p>
          <p className="text-2xs text-muted-foreground">Total</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-[hsl(var(--success))]">${data.paid.toLocaleString()}</p>
          <p className="text-2xs text-muted-foreground">Paid</p>
        </div>
        <div className="text-center">
          <p className={`text-lg font-bold ${data.outstanding > 0 ? "text-[hsl(var(--warning))]" : "text-[hsl(var(--success))]"}`}>
            ${data.outstanding.toLocaleString()}
          </p>
          <p className="text-2xs text-muted-foreground">Outstanding</p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {data.outstanding > 0 ? (
          <><AlertCircle className="h-3 w-3 text-[hsl(var(--warning))]" /> {data.invoiceCount - data.paidCount} invoice(s) pending</>
        ) : (
          <><CheckCircle2 className="h-3 w-3 text-[hsl(var(--success))]" /> All invoices paid</>
        )}
      </div>
    </motion.div>
  );
}
