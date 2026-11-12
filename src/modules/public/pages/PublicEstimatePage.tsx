import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Loader2, Phone, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Item { title: string; description: string | null; quantity: number; unit: string | null; line_total: number; is_optional: boolean }
interface CustomerEstimate {
  estimate_number: string; status: string; issue_date: string | null; expiry_date: string | null; responded_at: string | null;
  job_address: string | null; job_type: string | null; scope_of_work: string | null; notes: string | null; terms_conditions: string | null;
  subtotal: number; discount: number; tax_total: number; grand_total: number; deposit: number | null;
  sections: { title: string; items: Item[] }[];
  customer_first_name: string;
  business: { name: string; handle: string | null; phone: string | null; avatar_url: string | null };
}

const money = (n: number) => `$${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const day = (d: string | null) => d ? new Date(d.length === 10 ? `${d}T12:00:00` : d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "";

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <Helmet>
        <title>{title}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <main className="mx-auto max-w-xl px-4 py-6 sm:py-10">{children}</main>
      <footer className="pb-8 text-center text-xs text-muted-foreground">
        Powered by <Link to="/" className="text-primary hover:underline">guzzl.pro</Link>
      </footer>
    </div>
  );
}

export default function PublicEstimatePage() {
  const { token } = useParams();
  const [mode, setMode] = useState<null | "approve" | "decline">(null);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ status: string; at: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["public-estimate", token],
    enabled: !!token,
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("estimate-share", { body: { action: "view", token } });
      if (error || !data?.estimate) return null;
      return data.estimate as CustomerEstimate;
    },
  });

  if (isLoading) {
    return <Shell title="Estimate | guzzl.pro"><div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div></Shell>;
  }
  if (!data) {
    return <Shell title="Estimate | guzzl.pro"><p className="py-24 text-center text-foreground">This estimate link isn't valid.</p></Shell>;
  }

  const est = data;
  const biz = est.business.name || "The business";
  const status = result?.status ?? est.status;
  const respondedAt = result?.at ?? est.responded_at;
  const canRespond = status === "sent" || status === "viewed";

  const respond = async (decision: "approved" | "declined") => {
    setError(null);
    if (decision === "approved" && !name.trim()) { setError("Please type your full name."); return; }
    setSending(true);
    const { data: r, error: err } = await supabase.functions.invoke("estimate-share", {
      body: { action: "respond", token, decision, name: name.trim() || null, note: note.trim() || null },
    });
    setSending(false);
    if (err || !r?.success) {
      let msg = "Something went wrong. Please try again.";
      const ctx = (err as any)?.context;
      if (ctx instanceof Response) { const j = await ctx.json().catch(() => null); if (j?.error) msg = j.error; }
      setError(msg);
      return;
    }
    setResult({ status: r.status, at: r.responded_at });
    setMode(null);
  };

  return (
    <Shell title={`Estimate from ${biz} | guzzl.pro`}>
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <header className="p-5 sm:p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              {est.business.avatar_url && <AvatarImage src={est.business.avatar_url} alt={biz} />}
              <AvatarFallback>{biz.charAt(0)}</AvatarFallback>
            </Avatar>
            <p className="font-semibold text-foreground">{biz}</p>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-foreground">Estimate {est.estimate_number}</h1>
          {est.customer_first_name && <p className="text-muted-foreground">Prepared for {est.customer_first_name}</p>}
          <div className="mt-2 text-sm text-muted-foreground space-y-0.5">
            {est.issue_date && <p>{day(est.issue_date)}</p>}
            {est.expiry_date && <p>Valid until {day(est.expiry_date)}</p>}
          </div>
        </header>

        {(est.job_address || est.scope_of_work) && (
          <section className="p-5 sm:p-6 border-b border-border space-y-3 text-[15px]">
            {est.job_address && <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Job address</p><p className="text-foreground">{est.job_address}</p></div>}
            {est.scope_of_work && <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Scope of work</p><p className="text-foreground whitespace-pre-wrap">{est.scope_of_work}</p></div>}
          </section>
        )}

        <section className="p-5 sm:p-6 border-b border-border space-y-5">
          {est.sections.filter((s) => s.items.length > 0).map((s, si) => (
            <div key={si}>
              {s.title && <h2 className="font-semibold text-foreground mb-2">{s.title}</h2>}
              <ul className="divide-y divide-border">
                {s.items.map((it, ii) => (
                  <li key={ii} className="py-3 flex gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-medium">
                        {it.title}
                        {it.is_optional && <span className="ml-2 align-middle rounded border border-border px-1.5 py-0.5 text-[11px] font-normal text-muted-foreground">Optional</span>}
                      </p>
                      {it.description && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{it.description}</p>}
                      <p className="text-sm text-muted-foreground">{it.quantity}{it.unit ? ` ${it.unit}` : ""}</p>
                    </div>
                    <p className="tabular-nums text-foreground font-medium">{money(it.line_total)}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="p-5 sm:p-6 border-b border-border space-y-1.5 text-[15px]">
          <Row label="Subtotal" value={money(est.subtotal)} />
          {est.discount > 0 && <Row label="Discount" value={`-${money(est.discount)}`} />}
          <Row label="Tax" value={money(est.tax_total)} />
          <div className="flex justify-between pt-2 text-lg font-bold text-foreground"><span>Total</span><span className="tabular-nums">{money(est.grand_total)}</span></div>
          {est.deposit && <Row label="Deposit due" value={money(est.deposit)} />}
        </section>

        {(est.notes || est.terms_conditions) && (
          <section className="p-5 sm:p-6 border-b border-border space-y-3 text-sm">
            {est.notes && <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Notes</p><p className="text-foreground whitespace-pre-wrap">{est.notes}</p></div>}
            {est.terms_conditions && <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Terms</p><p className="text-muted-foreground whitespace-pre-wrap">{est.terms_conditions}</p></div>}
          </section>
        )}

        <section className="p-5 sm:p-6 space-y-3">
          {status === "approved" && <p className="text-foreground font-medium">You approved this estimate on {day(respondedAt)}. {biz} has been told.</p>}
          {status === "declined" && <p className="text-foreground font-medium">You declined this estimate on {day(respondedAt)}. {biz} has been told.</p>}
          {status === "expired" && <p className="text-foreground font-medium">This estimate expired on {day(est.expiry_date)}. Contact {biz} for a new one.</p>}

          {canRespond && mode === null && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button className="min-h-12 text-base gap-2" onClick={() => { setMode("approve"); setError(null); }}><Check className="h-4 w-4" /> Approve estimate</Button>
              <Button variant="outline" className="min-h-12 text-base gap-2" onClick={() => { setMode("decline"); setError(null); }}><X className="h-4 w-4" /> Decline</Button>
            </div>
          )}
          {canRespond && mode === "approve" && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground" htmlFor="est-name">Your full name</label>
              <Input id="est-name" className="h-12 text-base" value={name} onChange={(e) => setName(e.target.value)} maxLength={200} autoComplete="name" />
              <p className="text-sm text-muted-foreground">Typing your name confirms you accept this estimate.</p>
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <Button className="w-full min-h-12 text-base" onClick={() => respond("approved")} disabled={sending}>
                {sending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Approve estimate
              </Button>
              <button className="w-full text-sm text-muted-foreground" onClick={() => setMode(null)}>Back</button>
            </div>
          )}
          {canRespond && mode === "decline" && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground" htmlFor="est-note">Anything we should know?</label>
              <Textarea id="est-note" className="text-base" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <Button variant="outline" className="w-full min-h-12 text-base" onClick={() => respond("declined")} disabled={sending}>
                {sending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Decline
              </Button>
              <button className="w-full text-sm text-muted-foreground" onClick={() => setMode(null)}>Back</button>
            </div>
          )}

          <div className="pt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
            {est.business.phone ? (
              <a href={`tel:${est.business.phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-1.5 text-primary min-h-11"><Phone className="h-4 w-4" /> Questions? Call {est.business.phone}</a>
            ) : <span />}
            {est.business.handle && <Link to={`/${est.business.handle}`} className="text-primary hover:underline">See {biz}'s card</Link>}
          </div>
        </section>
      </div>
    </Shell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between text-muted-foreground"><span>{label}</span><span className="tabular-nums text-foreground">{value}</span></div>;
}
