import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Send, Loader2, CheckCircle2, Sparkles, Shield, Clock, Users,
  MapPin, Briefcase, ArrowRight, Wrench,
} from "lucide-react";

const BUDGET_OPTIONS = ["Under $100", "$100–$500", "$500–$1,000", "$1,000–$5,000", "$5,000+", "Not sure"];
const TIMELINE_OPTIONS = ["ASAP", "This week", "This month", "Flexible"];
const POPULAR_SERVICES = [
  "Plumbing", "Electrical", "Painting", "Landscaping", "Cleaning",
  "Roofing", "HVAC", "Moving", "Photography", "Personal Training",
];

export default function RequestServicePage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ token: string; matchCount: number } | null>(null);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", service_needed: "",
    description: "", location: "", budget: "", timeline: "",
  });

  const update = (f: string, v: string) => setForm((prev) => ({ ...prev, [f]: v }));
  const isValid = form.name.trim().length >= 2 && (form.email.trim() || form.phone.trim()) && form.service_needed.trim();

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    try {
      const { data: estReq, error } = await (supabase as any)
        .from("estimate_requests")
        .insert({
          requester_name: form.name.trim(),
          requester_email: form.email.trim() || null,
          requester_phone: form.phone.trim() || null,
          service_needed: form.service_needed.trim(),
          request_details: form.description.trim() || null,
          location: form.location.trim() || null,
          city: form.location.trim() || null,
          budget: form.budget || null,
          timeline: form.timeline || null,
          source: "instant_request",
        })
        .select("id, tracking_token")
        .single();
      if (error) throw error;

      // Trigger matching
      let matchCount = 0;
      try {
        const { data: routeResult } = await supabase.functions.invoke("process-estimate-matches", {
          body: { estimateRequestId: estReq.id },
        });
        matchCount = routeResult?.matched || 0;
      } catch (e) {
        console.error("Matching error:", e);
      }

      setSuccess({ token: estReq.tracking_token, matchCount });
      toast.success("Service request sent successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Helmet>
        <title>Request a Service | CardPilot</title>
        <meta name="description" content="Get free quotes from verified local professionals. Describe your project and receive responses fast." />
      </Helmet>

      {/* Hero */}
      <div className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3" />
        <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16 text-center relative">
          <Badge variant="secondary" className="mb-4 text-xs gap-1.5">
            <Sparkles className="h-3 w-3" /> Free • No obligation
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Get Quotes from Local Pros
          </h1>
          <p className="mt-3 text-muted-foreground text-lg max-w-xl mx-auto">
            Describe what you need, and we'll match you with verified professionals who can help.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <AnimatePresence mode="wait">
          {!success ? (
            <motion.div key="form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-border shadow-lg">
                <CardContent className="p-6 sm:p-8 space-y-6">
                  {/* Trust */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-2xs gap-1"><Shield className="h-2.5 w-2.5" /> Verified Pros</Badge>
                    <Badge variant="outline" className="text-2xs gap-1"><Clock className="h-2.5 w-2.5" /> Fast Responses</Badge>
                    <Badge variant="outline" className="text-2xs gap-1"><Users className="h-2.5 w-2.5" /> Up to 3 Quotes</Badge>
                  </div>

                  {/* Service selector chips */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">What service do you need? *</Label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {POPULAR_SERVICES.map((s) => (
                        <button
                          key={s}
                          onClick={() => update("service_needed", s)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                            form.service_needed === s
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <Input
                      value={form.service_needed}
                      onChange={(e) => update("service_needed", e.target.value)}
                      placeholder="Or type your own..."
                      className="h-10"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <Label className="text-sm font-medium mb-1.5 block">Describe your project</Label>
                    <Textarea
                      value={form.description}
                      onChange={(e) => update("description", e.target.value)}
                      placeholder="What exactly do you need done? Include any relevant details..."
                      rows={4}
                    />
                  </div>

                  {/* Contact info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium mb-1.5 block">Your name *</Label>
                      <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="John Doe" className="h-10" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium mb-1.5 block">Email *</Label>
                      <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="you@email.com" className="h-10" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium mb-1.5 block">Phone</Label>
                      <Input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="(555) 123-4567" className="h-10" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium mb-1.5 block">Location</Label>
                      <Input value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="City, State" className="h-10" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium mb-1.5 block">Budget</Label>
                      <Select value={form.budget} onValueChange={(v) => update("budget", v)}>
                        <SelectTrigger className="h-10"><SelectValue placeholder="Select budget..." /></SelectTrigger>
                        <SelectContent>{BUDGET_OPTIONS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium mb-1.5 block">Timeline</Label>
                      <Select value={form.timeline} onValueChange={(v) => update("timeline", v)}>
                        <SelectTrigger className="h-10"><SelectValue placeholder="When do you need it?" /></SelectTrigger>
                        <SelectContent>{TIMELINE_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button onClick={handleSubmit} disabled={!isValid || submitting} className="w-full h-12 gap-2 text-base shadow-md">
                    {submitting ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Finding professionals...</>
                    ) : (
                      <><Send className="h-4 w-4" /> Get Quotes</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="border-border shadow-lg">
                <CardContent className="p-8 text-center space-y-5">
                  <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Request Sent!</h2>
                    <p className="text-muted-foreground mt-2">
                      {success.matchCount > 0
                        ? `We've matched you with ${success.matchCount} professional${success.matchCount > 1 ? "s" : ""}. Expect responses shortly.`
                        : "We'll find matching professionals and notify them of your request."
                      }
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3 justify-center text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> Up to 3 quotes</span>
                    <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> Most respond within 1 hour</span>
                  </div>

                  {success.token && (
                    <div className="pt-3 space-y-3">
                      <p className="text-xs text-muted-foreground">Track your responses:</p>
                      <Button variant="outline" onClick={() => navigate(`/request-status/${success.token}`)} className="gap-2">
                        <Briefcase className="h-4 w-4" /> View Responses <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  <Button variant="ghost" onClick={() => { setSuccess(null); setForm({ name: "", email: "", phone: "", service_needed: "", description: "", location: "", budget: "", timeline: "" }); }}>
                    Submit Another Request
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
