import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { OnDutyProfessional } from "@/hooks/useOnDutyMap";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
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
      // Use the capture_lead RPC to create a CRM lead for the professional
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

      setSubmitted(true);
      toast({
        title: "Request sent!",
        description: `${professional.name.split(" ")[0]} will be notified right away.`,
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
        <h4 className="font-bold text-sm">Request Sent!</h4>
        <p className="text-xs text-muted-foreground mt-1 max-w-[250px] mx-auto">
          {professional.name.split(" ")[0]} has been notified and will reach out to you shortly.
        </p>
        <Button
          size="sm"
          variant="outline"
          className="mt-4"
          onClick={() => {
            setSubmitted(false);
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
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Sending...
          </>
        ) : (
          "Send Quote Request"
        )}
      </Button>

      <p className="text-[10px] text-muted-foreground text-center">
        Your info goes directly to {professional.name.split(" ")[0]}'s CRM. No spam.
      </p>
    </form>
  );
}
