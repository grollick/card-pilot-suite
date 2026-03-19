import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { OnDutyProfessional } from "@/hooks/useOnDutyMap";
import { Loader2, CheckCircle2, AlertCircle, Users, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Props {
  professional: OnDutyProfessional;
  onSuccess?: () => void;
}

export default function QuickQuoteForm({ professional, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [details, setDetails] = useState(
    `Hi, I saw you're available on CardPilot. I'm looking for help with...`
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !details.trim()) {
      setError("Please fill in your name and project details.");
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setError("Please provide an email or phone number.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create CRM lead for this specific professional
      const { error: rpcError } = await supabase.rpc("capture_lead", {
        p_owner_id: professional.id,
        p_name: name.trim(),
        p_email: email.trim() || null,
        p_phone: phone.trim() || null,
        p_source: "marketplace",
        p_activity_type: "quote_requested",
        p_activity_title: `Quote request from map — ${name.trim()}`,
        p_activity_description: details.trim(),
        p_meta_json: {
          from_map: true,
          profession: professional.profession_name,
          requester_details: details.trim(),
        },
        p_handle: professional.handle,
      });

      if (rpcError) throw rpcError;

      // 2. Also create an estimate_request and trigger auto-matching
      // to find additional nearby professionals
      let matched = 1; // The direct professional counts as 1
      try {
        const { data: estReq } = await (supabase
          .from("estimate_requests" as any)
          .insert({
            requester_name: name.trim(),
            requester_email: email.trim() || null,
            requester_phone: phone.trim() || null,
            service_needed: professional.profession_name || null,
            request_details: details.trim(),
            city: professional.city || null,
            profession: professional.profession_name || null,
            source: "map_quote",
          })
          .select("id")
          .single() as any);

        if (estReq?.id) {
          const { data: routeResult } = await supabase.functions.invoke(
            "process-estimate-matches",
            { body: { estimateRequestId: estReq.id } }
          );
          matched += routeResult?.matched ?? 0;
        }
      } catch (e) {
        console.error("Auto-match error:", e);
      }

      setMatchCount(matched);
      setSubmitted(true);
      toast({
        title: "Request sent!",
        description: `We've contacted ${matched} professional${matched > 1 ? "s" : ""} for you.`,
      });
    } catch (err: any) {
      console.error("QuickQuote error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-6">
        <CheckCircle2 className="h-10 w-10 text-success mx-auto mb-3" />
        <h4 className="font-bold text-sm">
          {matchCount > 1
            ? `We've contacted ${matchCount} professionals!`
            : "Request Sent!"}
        </h4>
        <p className="text-xs text-muted-foreground mt-1 max-w-[280px] mx-auto">
          {matchCount > 1
            ? `${professional.name.split(" ")[0]} and ${matchCount - 1} other pro${matchCount - 1 > 1 ? "s" : ""} have been notified. Expect responses shortly.`
            : `${professional.name.split(" ")[0]} has been notified and will reach out to you shortly.`}
        </p>

        <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" /> Up to 3 quotes
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> Most respond in &lt;1hr
          </span>
        </div>

        <Button
          size="sm"
          variant="outline"
          className="mt-4"
          onClick={() => {
            setSubmitted(false);
            setMatchCount(0);
            setName("");
            setEmail("");
            setPhone("");
            setDetails("");
            onSuccess?.();
          }}
        >
          Done
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-xs font-medium text-foreground">Your Name *</label>
        <Input
          placeholder="Jane Smith"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 h-10"
          maxLength={100}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium text-foreground">Email</label>
          <Input
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 h-10"
            maxLength={255}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground">Phone</label>
          <Input
            type="tel"
            placeholder="(555) 123-4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 h-10"
            maxLength={20}
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-foreground">What do you need? *</label>
        <Textarea
          placeholder="Describe your project or what you need help with..."
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          className="mt-1 min-h-[80px]"
          maxLength={1000}
          required
        />
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </div>
      )}

      <Button type="submit" className="w-full h-11" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Finding professionals...
          </>
        ) : (
          "Send Quote Request"
        )}
      </Button>

      <p className="text-[10px] text-muted-foreground text-center">
        Your request goes to {professional.name.split(" ")[0]} and similar nearby pros. No spam.
      </p>
    </form>
  );
}
