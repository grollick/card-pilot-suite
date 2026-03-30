import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, MapPin, ArrowRight, Sparkles, CheckCircle2, Rocket, Plus, CalendarCheck, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Step = "form" | "creating" | "success";

export default function BusinessOnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("form");
  const [businessName, setBusinessName] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createdSlug, setCreatedSlug] = useState("");

  const canSubmit = businessName.trim().length >= 2 && city.trim().length >= 2;

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setStep("creating");

    try {
      const { data, error } = await supabase.rpc("onboard_business", {
        p_business_name: businessName.trim(),
        p_city: city.trim(),
        p_region: region.trim() || city.trim(),
      });

      if (error) throw error;

      const result = data as { status: string; business_id: string; slug?: string };

      if (result.status === "already_exists") {
        toast.info("You already have a business profile!");
        navigate("/app/marketplace-hub");
        return;
      }

      setCreatedSlug(result.slug ?? "");

      // Brief delay for animation
      await new Promise((r) => setTimeout(r, 1200));
      setStep("success");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
      setStep("form");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Helmet>
        <title>Set Up Your Business | guzzl.pro</title>
      </Helmet>

      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {step === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-2">
                  <Building2 className="h-7 w-7 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">
                  Set up your business
                </h1>
                <p className="text-sm text-muted-foreground">
                  Takes under a minute. You'll be live on guzzl instantly.
                </p>
              </div>

              {/* Form */}
              <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName" className="text-sm font-medium flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    Business name
                  </Label>
                  <Input
                    id="businessName"
                    placeholder="e.g. North Shore Landscaping"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    maxLength={100}
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm font-medium flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      City
                    </Label>
                    <Input
                      id="city"
                      placeholder="Thunder Bay"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      maxLength={100}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region" className="text-sm font-medium">
                      Province / State
                    </Label>
                    <Input
                      id="region"
                      placeholder="Ontario"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      maxLength={100}
                    />
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full font-semibold mt-2"
                  disabled={!canSubmit || submitting}
                  onClick={handleSubmit}
                >
                  Create My Business <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Free to start — no credit card required
              </p>
            </motion.div>
          )}

          {step === "creating" && (
            <motion.div
              key="creating"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center space-y-6 py-12"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10"
              >
                <Sparkles className="h-8 w-8 text-primary" />
              </motion.div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-foreground">Setting up your business…</h2>
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  {["Creating your profile", "Setting up your card", "Assigning your Free plan"].map((text, i) => (
                    <motion.p
                      key={text}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.4 }}
                    >
                      {text}
                    </motion.p>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Celebration */}
              <div className="text-center space-y-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.1 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10"
                >
                  <CheckCircle2 className="h-8 w-8 text-success" />
                </motion.div>
                <h1 className="text-2xl font-bold text-foreground">
                  Your guzzl card is live 🎉
                </h1>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{businessName}</span> is now visible on the marketplace.
                </p>
              </div>

              {/* Next Steps */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Rocket className="h-4 w-4 text-primary" />
                  Quick next steps
                </h3>
                {[
                  { icon: Plus, label: "Add your services", desc: "Help customers find exactly what you offer" },
                  { icon: CalendarCheck, label: "Enable booking", desc: "Let customers book directly" },
                  { icon: Share2, label: "Share your card", desc: "Send your guzzl link to customers" },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.15 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <Button
                size="lg"
                className="w-full font-semibold"
                onClick={() => navigate("/app/marketplace-hub")}
              >
                Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
