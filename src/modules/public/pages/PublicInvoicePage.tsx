import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { format } from "date-fns";
import { AlertTriangle, Loader2, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";
import DocumentStatusBadge from "@/components/DocumentStatusBadge";
import InvoicePaymentSection, { methodName, type InvoiceReport } from "@/modules/public/components/InvoicePaymentSection";

const BAD_LINK = "This invoice link isn't working. Please ask the business that sent it for a new link.";
const money = (n: unknown) =>
  `$${(Number(n ?? 0) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const day = (d?: string | null) => (d ? format(new Date(`${d.slice(0, 10)}T12:00:00`), "MMMM d, yyyy") : null);

export default function PublicInvoicePage() {
  const { token } = useParams();
  const [inv, setInv] = useState<any>(null);
  const [state, setState] = useState<"loading" | "ok" | "bad">("loading");

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await supabase.functions.invoke("invoice-share", { body: { action: "view", token } });
      if (!alive) return;
      if (error || !data?.invoice) { setState("bad"); return; }
      setInv(data.invoice);
      setState("ok");
    })();
    return () => { alive = false; };
  }, [token]);

  const head = (title: string) => (
    <Helmet>
      <title>{title}</title>
      <meta name="robots" content="noindex, nofollow" />
    </Helmet>
  );

  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        {head("Invoice")}
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (state === "bad" || !inv) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        {head("Invoice")}
        <div className="text-center space-y-3 max-w-sm">
          <AlertTriangle className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <p className="text-base">{BAD_LINK}</p>
        </div>
      </div>
    );
  }

  const biz: string = inv.business.name;
  const grand = Number(inv.grand_total);
  const paid = Number(inv.amount_paid);
  const isPaid = inv.status === "paid";
  const balance = Math.max(0, grand - paid);
  const report: InvoiceReport = {
    customer_reported_at: inv.customer_reported_at,
    customer_reported_method: inv.customer_reported_method,
    customer_reported_reference: inv.customer_reported_reference,
    customer_reported_note: inv.customer_reported_note,
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {head(`Invoice ${inv.invoice_number} from ${biz}`)}

      <header className="bg-background border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-5 space-y-3">
          <div className="flex items-center gap-3">
            {inv.business.logo_url && (
              <img src={inv.business.logo_url} alt="" className="h-10 w-10 rounded-full object-cover" />
            )}
            <p className="font-semibold text-base">{biz}</p>
          </div>
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl font-bold">Invoice {inv.invoice_number}</h1>
            <DocumentStatusBadge status={inv.status} />
          </div>
          {inv.customer.name && (
            <p className="text-sm">For {inv.customer.name}{inv.customer.company ? `, ${inv.customer.company}` : ""}</p>
          )}
          <div className="text-sm text-muted-foreground space-y-0.5">
            {day(inv.issue_date) && <p>Issued {day(inv.issue_date)}</p>}
            {day(inv.due_date) && <p>Due {day(inv.due_date)}</p>}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <section className="bg-background rounded-xl border border-border p-5 space-y-4">
          <div className="space-y-1">
            {inv.line_items.map((item: any, i: number) => (
              <div key={i} className="flex justify-between gap-3 py-2 border-b border-border/40 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{item.title}</p>
                  {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                  <p className="text-xs text-muted-foreground tabular-nums">{item.quantity} × {money(item.unit_price)}</p>
                </div>
                <span className="text-sm font-semibold tabular-nums shrink-0">{money(item.line_total)}</span>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">{money(inv.subtotal)}</span>
            </div>
            {Number(inv.discount_amount) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span className="tabular-nums">-{money(inv.discount_amount)}</span>
              </div>
            )}
            {Number(inv.tax_total) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span className="tabular-nums">{money(inv.tax_total)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between items-baseline">
              <span className="font-semibold">Total</span>
              <span className="text-2xl font-bold tabular-nums">{money(grand)}</span>
            </div>
            {paid > 0 && !isPaid && (
              <>
                <div className="flex justify-between text-sm text-primary">
                  <span>Paid</span>
                  <span className="tabular-nums">-{money(paid)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Balance</span>
                  <span className="tabular-nums">{money(balance)}</span>
                </div>
              </>
            )}
          </div>

          {inv.notes && (
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">Notes</p>
              <p className="text-sm whitespace-pre-line">{inv.notes}</p>
            </div>
          )}
          {inv.terms && (
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">Terms</p>
              <p className="text-sm whitespace-pre-line">{inv.terms}</p>
            </div>
          )}
        </section>

        <InvoicePaymentSection
          token={token!}
          status={inv.status}
          paidAt={inv.paid_at}
          businessName={biz}
          report={report}
          onReported={(r) => setInv({ ...inv, ...r })}
          payOnline={inv.pay_online}
          amountDue={balance}
        />

        {inv.payments.length > 0 && (
          <section className="bg-background rounded-xl border border-border p-5 space-y-2">
            <h2 className="text-sm font-semibold">Payments received</h2>
            {inv.payments.map((p: any, i: number) => (
              <div key={i} className="flex justify-between py-1.5 text-sm">
                <span>{p.paid_at ? format(new Date(p.paid_at), "MMM d, yyyy") : ""} · {methodName(p.payment_method)}</span>
                <span className="font-semibold tabular-nums text-primary">{money(p.amount)}</span>
              </div>
            ))}
          </section>
        )}

        <footer className="text-center py-4 space-y-2 text-sm">
          {inv.business.phone && (
            <a href={`tel:${inv.business.phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-1.5 text-primary min-h-11">
              <Phone className="h-4 w-4" /> Questions? Call {inv.business.phone}
            </a>
          )}
          {inv.business.handle && (
            <p><Link to={`/${inv.business.handle}`} className="text-primary hover:underline">See {biz}'s card</Link></p>
          )}
          <p className="text-xs text-muted-foreground pt-2">Powered by guzzl.pro</p>
        </footer>
      </main>
    </div>
  );
}
