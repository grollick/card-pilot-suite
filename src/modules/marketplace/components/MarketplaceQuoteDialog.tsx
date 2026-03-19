import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Loader2, CheckCircle2, Sparkles, Shield, Clock, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MarketplaceQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profession?: string;
  location?: string;
}

const BUDGET_OPTIONS = [
  "Under $100",
  "$100–$500",
  "$500–$1,000",
  "$1,000–$5,000",
  "$5,000+",
  "Not sure",
];

const TIMELINE_OPTIONS = [
  "ASAP",
  "This week",
  "This month",
  "Flexible",
];

export default function MarketplaceQuoteDialog({
  open,
  onOpenChange,
  profession,
  location,
}: MarketplaceQuoteDialogProps) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [submitting, setSubmitting] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    service_needed: "",
    budget: "",
    timeline: "",
    notes: "",
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const isValid = form.name.trim() && (form.email.trim() || form.phone.trim());

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);

    try {
      // 1. Insert the quote request
      const { data: quoteReq, error: insertErr } = await supabase
        .from("marketplace_quote_requests" as any)
        .insert({
          customer_name: form.name.trim(),
          customer_email: form.email.trim() || null,
          customer_phone: form.phone.trim() || null,
          service_needed: form.service_needed.trim() || null,
          budget: form.budget || null,
          timeline: form.timeline || null,
          profession: profession || null,
          location: location || null,
          notes: form.notes.trim() || null,
        })
        .select("id")
        .single();

      if (insertErr) throw insertErr;

      // 2. Call the edge function to route the lead
      const { data: routeResult, error: routeErr } = await supabase.functions.invoke(
        "route-marketplace-lead",
        {
          body: { quoteRequestId: (quoteReq as any).id },
        }
      );

      if (routeErr) {
        console.error("Lead routing error:", routeErr);
        // Still show success - the quote was saved
      }

      setMatchCount(routeResult?.matched ?? 0);
      setStep("success");
      const tier = routeResult?.qualityTier;
      if (tier === "high") {
        toast.success("High-quality request sent! Expect fast responses.");
      } else {
        toast.success("Quote request sent!");
      }
    } catch (err) {
      console.error("Quote submission error:", err);
      toast.error("Failed to send quote request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset after animation
    setTimeout(() => {
      setStep("form");
      setForm({ name: "", email: "", phone: "", service_needed: "", budget: "", timeline: "", notes: "" });
      setMatchCount(0);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <AnimatePresence mode="wait">
          {step === "form" ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <DialogHeader>
                <DialogTitle className="text-xl">Request a Quote</DialogTitle>
                <DialogDescription>
                  Tell us what you need — we'll match you with up to 3 top-rated professionals instantly.
                </DialogDescription>
              </DialogHeader>

              {/* Trust signals */}
              <div className="flex flex-wrap gap-2 mt-3 mb-5">
                <Badge variant="secondary" className="text-[10px] gap-1">
                  <Shield className="h-2.5 w-2.5" /> Verified pros
                </Badge>
                <Badge variant="secondary" className="text-[10px] gap-1">
                  <Clock className="h-2.5 w-2.5" /> Fast responses
                </Badge>
                <Badge variant="secondary" className="text-[10px] gap-1">
                  <Sparkles className="h-2.5 w-2.5" /> Free, no obligation
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="mq-name" className="text-xs font-medium">Name *</Label>
                    <Input
                      id="mq-name"
                      placeholder="Your name"
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="mq-email" className="text-xs font-medium">Email *</Label>
                    <Input
                      id="mq-email"
                      type="email"
                      placeholder="you@email.com"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="mq-phone" className="text-xs font-medium">Phone</Label>
                    <Input
                      id="mq-phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="mq-service" className="text-xs font-medium">Service needed</Label>
                    <Input
                      id="mq-service"
                      placeholder="e.g. Kitchen remodel"
                      value={form.service_needed}
                      onChange={(e) => update("service_needed", e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Budget</Label>
                    <Select value={form.budget} onValueChange={(v) => update("budget", v)}>
                      <SelectTrigger className="h-10"><SelectValue placeholder="Select budget…" /></SelectTrigger>
                      <SelectContent>
                        {BUDGET_OPTIONS.map((b) => (
                          <SelectItem key={b} value={b}>{b}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Timeline</Label>
                    <Select value={form.timeline} onValueChange={(v) => update("timeline", v)}>
                      <SelectTrigger className="h-10"><SelectValue placeholder="Select timeline…" /></SelectTrigger>
                      <SelectContent>
                        {TIMELINE_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="mq-notes" className="text-xs font-medium">Additional details</Label>
                  <Textarea
                    id="mq-notes"
                    placeholder="Describe your project or what you're looking for…"
                    value={form.notes}
                    onChange={(e) => update("notes", e.target.value)}
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!isValid || submitting}
                  className="w-full h-11 gap-2 shadow-sm"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Matching you with pros…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Get My Free Quotes
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6 space-y-4"
            >
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Quote Request Sent!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {matchCount > 0
                    ? `We've matched you with ${matchCount} professional${matchCount > 1 ? "s" : ""}. Expect a response shortly.`
                    : "We'll find matching professionals and notify them of your request."
                  }
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" /> Up to 3 matches
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Most respond within 1 hour
                </span>
              </div>
              <Button onClick={handleClose} variant="outline" className="mt-2">
                Done
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
