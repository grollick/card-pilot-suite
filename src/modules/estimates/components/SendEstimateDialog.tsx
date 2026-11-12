import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Link2, MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export interface SendableEstimate {
  id: string;
  estimate_number?: string;
  lead_id?: string | null;
  leads?: { name?: string | null; email?: string | null; phone?: string | null } | null;
}

interface Props {
  estimate: SendableEstimate | null;
  onOpenChange: (open: boolean) => void;
}

export default function SendEstimateDialog({ estimate, onOpenChange }: Props) {
  const qc = useQueryClient();
  const [manualLink, setManualLink] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "email" | "link" | "sms" | "manual">(null);
  const open = !!estimate;

  const { data: contact } = useQuery({
    queryKey: ["estimate-send-contact", estimate?.lead_id],
    enabled: open && !!estimate?.lead_id && !estimate?.leads,
    queryFn: async () => {
      const { data } = await supabase.from("leads").select("name,email,phone").eq("id", estimate!.lead_id!).maybeSingle();
      return data;
    },
  });
  const { data: business } = useQuery({
    queryKey: ["estimate-send-business"],
    enabled: open,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return "";
      const { data } = await supabase.from("profiles").select("company,name").eq("id", user.id).maybeSingle();
      return data?.company || data?.name || "";
    },
  });

  const lead = estimate?.leads ?? contact ?? null;
  const email = lead?.email?.trim() || "";
  const phone = lead?.phone?.trim() || "";
  const firstName = (lead?.name || "").trim().split(/\s+/)[0] || "there";

  const send = async (channel: "email" | "link") => {
    const { data, error } = await supabase.functions.invoke("estimate-share", {
      body: { action: "send", estimateId: estimate!.id, channel },
    });
    qc.invalidateQueries({ queryKey: ["estimates"] });
    qc.invalidateQueries({ queryKey: ["estimate"] });
    if (error || !data?.url) throw error || new Error("send failed");
    return data as { url: string; emailQueued: boolean; customerEmail: string | null };
  };

  const handleEmail = async () => {
    setBusy("email");
    try {
      const r = await send("email");
      if (r.emailQueued) { toast.success(`Estimate on its way to ${r.customerEmail}.`); onOpenChange(false); }
      else toast.error("The email could not be sent. You can still copy the link.");
    } catch {
      toast.error("The email could not be sent. You can still copy the link.");
    } finally { setBusy(null); }
  };

  const handleCopy = async () => {
    setBusy("link");
    try {
      let url: string;
      try {
        url = (await send("link")).url;
      } catch {
        toast.error("Couldn't make the link. Please try again.");
        return;
      }
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied.");
      } catch {
        // The browser blocked the clipboard; show the link so it can be copied by hand.
        setManualLink(url);
      }
    } finally { setBusy(null); }
  };

  const handleText = async () => {
    setBusy("sms");
    try {
      const r = await send("link");
      const msg = `Hi ${firstName}, here is your estimate from ${business || "us"}: ${r.url}`;
      window.location.href = `sms:${phone}?&body=${encodeURIComponent(msg)}`;
    } catch {
      toast.error("Couldn't make the link. Please try again.");
    } finally { setBusy(null); }
  };

  const handleManual = async () => {
    setBusy("manual");
    try {
      await send("link");
      toast.success("Marked as sent.");
      onOpenChange(false);
    } catch {
      toast.error("Couldn't update the estimate. Please try again.");
    } finally { setBusy(null); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Send to customer</DialogTitle>
          {estimate?.lead_id && <DialogDescription>{lead?.name || "Customer"}</DialogDescription>}
        </DialogHeader>
        {!estimate?.lead_id ? (
          <p className="text-sm text-muted-foreground">Pick a contact for this estimate first.</p>
        ) : (
          <div className="space-y-2">
            {email ? (
              <Button className="w-full min-h-11 justify-start gap-2" onClick={handleEmail} disabled={!!busy}>
                {busy === "email" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                <span className="truncate">Email it to {email}</span>
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground rounded-md border border-border p-3">Add an email to this contact to send it by email.</p>
            )}
            <Button variant="outline" className="w-full min-h-11 justify-start gap-2" onClick={handleCopy} disabled={!!busy}>
              {busy === "link" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
              Copy link
            </Button>
            {phone && (
              <Button variant="outline" className="w-full min-h-11 justify-start gap-2" onClick={handleText} disabled={!!busy}>
                {busy === "sms" ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                Text the link
              </Button>
            )}
            {manualLink && (
              <div className="space-y-1.5 pt-1">
                <p className="text-sm text-foreground">Copy this link and send it to your customer.</p>
                <input
                  readOnly
                  value={manualLink}
                  autoFocus
                  ref={(el) => el?.select()}
                  onFocus={(e) => e.currentTarget.select()}
                  className="w-full min-h-11 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                  aria-label="Estimate link"
                />
              </div>
            )}
            <button className="w-full pt-2 text-xs text-muted-foreground underline-offset-2 hover:underline" onClick={handleManual} disabled={!!busy}>
              I sent it another way
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
