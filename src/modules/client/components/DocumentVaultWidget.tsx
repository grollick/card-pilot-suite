import { motion } from "framer-motion";
import { FileText, Download, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface Props {
  leadIds: string[];
}

interface DocItem {
  id: string;
  type: "estimate" | "invoice";
  title: string;
  status: string;
  total: number;
  date: string;
  paymentToken?: string | null;
}

export default function DocumentVaultWidget({ leadIds }: Props) {
  const { data: docs, isLoading } = useQuery<DocItem[]>({
    queryKey: ["client-documents", leadIds],
    enabled: leadIds.length > 0,
    queryFn: async () => {
      const items: DocItem[] = [];

      // Get estimates
      const { data: estimates } = await supabase
        .from("estimates")
        .select("id, estimate_number, status, grand_total, issue_date")
        .in("lead_id", leadIds)
        .order("issue_date", { ascending: false })
        .limit(10);

      estimates?.forEach((e) => {
        items.push({
          id: e.id,
          type: "estimate",
          title: `Estimate ${e.estimate_number}`,
          status: e.status,
          total: Number(e.grand_total || 0),
          date: e.issue_date,
        });
      });

      // Get invoices
      const { data: invoices } = await supabase
        .from("invoices")
        .select("id, invoice_number, status, grand_total, issue_date, payment_token")
        .in("lead_id", leadIds)
        .order("issue_date", { ascending: false })
        .limit(10);

      invoices?.forEach((inv) => {
        items.push({
          id: inv.id,
          type: "invoice",
          title: `Invoice ${inv.invoice_number}`,
          status: inv.status,
          total: Number(inv.grand_total || 0),
          date: inv.issue_date,
          paymentToken: inv.payment_token,
        });
      });

      return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
  });

  if (isLoading) return <Skeleton className="h-40 rounded-xl" />;
  if (!docs?.length) return null;

  const statusColor: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    sent: "bg-primary/15 text-primary",
    viewed: "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]",
    approved: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]",
    paid: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]",
    overdue: "bg-destructive/15 text-destructive",
    declined: "bg-destructive/15 text-destructive",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-5 space-y-3"
    >
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" />
        Documents
      </h3>

      <div className="space-y-2">
        {docs.map((doc) => (
          <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
            <div className={`h-8 w-8 rounded-md flex items-center justify-center ${
              doc.type === "invoice" ? "bg-[hsl(var(--success))]/10" : "bg-primary/10"
            }`}>
              <FileText className={`h-4 w-4 ${
                doc.type === "invoice" ? "text-[hsl(var(--success))]" : "text-primary"
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{doc.title}</p>
              <p className="text-2xs text-muted-foreground">
                {format(new Date(doc.date), "MMM d, yyyy")} · ${doc.total.toLocaleString()}
              </p>
            </div>
            <Badge className={`text-[10px] border-0 ${statusColor[doc.status] || statusColor.draft}`}>
              {doc.status}
            </Badge>
            {doc.type === "invoice" && doc.paymentToken && doc.status !== "paid" && (
              <Button variant="outline" size="sm" asChild>
                <a href={`/pay/${doc.paymentToken}`} target="_blank" rel="noreferrer">
                  Pay <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
