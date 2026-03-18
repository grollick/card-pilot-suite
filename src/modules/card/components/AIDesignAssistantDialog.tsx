import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles, Loader2, ArrowRight, ArrowLeft, CheckCircle2,
  Briefcase, MapPin, Palette, MousePointerClick, Wrench, Crown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const STYLE_OPTIONS = [
  { id: "modern", label: "Modern", desc: "Clean, minimal, fresh", color: "bg-blue-500" },
  { id: "classic", label: "Classic", desc: "Timeless, professional", color: "bg-stone-500" },
  { id: "bold", label: "Bold", desc: "High impact, vibrant", color: "bg-orange-500" },
  { id: "elegant", label: "Elegant", desc: "Refined, luxurious", color: "bg-violet-500" },
];

const CTA_OPTIONS = [
  "Book Now", "Get a Quote", "Call Me", "Send Message", "View Portfolio", "Schedule Consultation",
];

export interface AICardResult {
  hero: { tagline: string; bio: string };
  services: { name: string; description: string; price_hint?: string }[];
  testimonials: { name: string; text: string; rating: number }[];
  promo: { headline: string; body: string; cta_text: string };
  about: string;
  cta_text: string;
  sections_order: string[];
  theme: {
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    background_color: string;
    font_primary?: string;
    font_secondary?: string;
    border_radius?: string;
  };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCardGenerated: (result: AICardResult) => void;
  userName?: string;
  userCompany?: string;
  userProfession?: string;
  isPro: boolean;
}

type Step = "intro" | "details" | "style" | "generating" | "done";

export default function AIDesignAssistantDialog({
  open, onOpenChange, onCardGenerated, userName, userCompany, userProfession, isPro,
}: Props) {
  const [step, setStep] = useState<Step>("intro");
  const [businessType, setBusinessType] = useState(userProfession || "");
  const [services, setServices] = useState("");
  const [city, setCity] = useState("");
  const [style, setStyle] = useState("modern");
  const [primaryCta, setPrimaryCta] = useState("Book Now");
  const [generatedResult, setGeneratedResult] = useState<AICardResult | null>(null);

  const resetState = () => {
    setStep("intro");
    setBusinessType(userProfession || "");
    setServices("");
    setCity("");
    setStyle("modern");
    setPrimaryCta("Book Now");
    setGeneratedResult(null);
  };

  const handleGenerate = async () => {
    setStep("generating");
    try {
      const { data, error } = await supabase.functions.invoke("ai-design-assistant", {
        body: {
          business_type: businessType,
          services,
          city,
          style,
          primary_cta: primaryCta,
          name: userName,
          company: userCompany,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.content) throw new Error("No content returned");

      setGeneratedResult(data.content);
      setStep("done");
    } catch (err: any) {
      console.error("AI Design Assistant error:", err);
      toast.error(err.message || "Failed to generate card. Please try again.");
      setStep("style");
    }
  };

  const handleApply = () => {
    if (generatedResult) {
      onCardGenerated(generatedResult);
      toast.success("AI card loaded into your builder! Customize it to make it yours.");
      onOpenChange(false);
      setTimeout(resetState, 300);
    }
  };

  const slideVariants = {
    enter: { x: 30, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -30, opacity: 0 },
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if (!val) setTimeout(resetState, 300); }}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">

        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            AI Design Assistant
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Answer a few questions and we'll create your card in seconds.
          </DialogDescription>
        </DialogHeader>

        {/* Progress dots */}
        {step !== "generating" && (
          <div className="flex items-center justify-center gap-1.5 py-3 shrink-0">
            {(["intro", "details", "style", "done"] as const).map((s, i) => (
              <div key={s} className={`h-1.5 rounded-full transition-all ${
                s === step ? "w-6 bg-primary" :
                (["intro","details","style","done"].indexOf(step) > i) ? "w-1.5 bg-primary/40" : "w-1.5 bg-muted"
              }`} />
            ))}
          </div>
        )}

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 pb-6">
            <AnimatePresence mode="wait">

              {/* ── Step: Intro ── */}
              {step === "intro" && (
                <motion.div key="intro" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }} className="space-y-5 pt-2">
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 text-center space-y-3">
                    <div className="inline-flex h-14 w-14 rounded-2xl bg-primary/10 items-center justify-center mx-auto">
                      <Sparkles className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="text-base font-bold">Create your card in under 60 seconds</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                      Our AI will generate a complete, professional digital business card tailored to your business.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      { icon: Briefcase, text: "Profession-specific sections & content" },
                      { icon: Palette, text: "Matching color palette & typography" },
                      { icon: Wrench, text: "Fully editable after generation" },
                    ].map(({ icon: Icon, text }) => (
                      <div key={text} className="flex items-center gap-3 rounded-lg border border-border p-3">
                        <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className="text-sm">{text}</span>
                      </div>
                    ))}
                  </div>

                  <Button className="w-full" size="lg" onClick={() => setStep("details")}>
                    Get Started <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </motion.div>
              )}

              {/* ── Step: Business Details ── */}
              {step === "details" && (
                <motion.div key="details" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Briefcase className="h-3.5 w-3.5 text-primary" />
                      What type of business?
                    </Label>
                    <Input
                      placeholder="e.g. Plumber, Barber, Photographer, Realtor…"
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Wrench className="h-3.5 w-3.5 text-primary" />
                      What services do you offer?
                    </Label>
                    <Textarea
                      placeholder="e.g. Kitchen remodels, bathroom renovations, deck builds…"
                      value={services}
                      onChange={(e) => setServices(e.target.value)}
                      rows={3}
                    />
                    <p className="text-[10px] text-muted-foreground">Separate with commas or new lines</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      City or region
                    </Label>
                    <Input
                      placeholder="e.g. Austin, TX"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="h-10"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="ghost" onClick={() => setStep("intro")} className="gap-1">
                      <ArrowLeft className="h-3.5 w-3.5" /> Back
                    </Button>
                    <Button className="flex-1" onClick={() => setStep("style")} disabled={!businessType.trim()}>
                      Next: Choose Style <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ── Step: Style ── */}
              {step === "style" && (
                <motion.div key="style" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Palette className="h-3.5 w-3.5 text-primary" />
                      Preferred visual style
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {STYLE_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => setStyle(opt.id)}
                          className={`relative rounded-xl border-2 p-3 text-left transition-all ${
                            style === opt.id
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border hover:border-primary/30"
                          }`}
                        >
                          <div className={`h-2 w-8 rounded-full ${opt.color} mb-2`} />
                          <p className="text-sm font-semibold">{opt.label}</p>
                          <p className="text-[11px] text-muted-foreground">{opt.desc}</p>
                          {style === opt.id && (
                            <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-primary" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <MousePointerClick className="h-3.5 w-3.5 text-primary" />
                      Primary call-to-action
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {CTA_OPTIONS.map((cta) => (
                        <button
                          key={cta}
                          onClick={() => setPrimaryCta(cta)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                            primaryCta === cta
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {cta}
                        </button>
                      ))}
                    </div>
                  </div>

                  {!isPro && (
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 flex items-start gap-2">
                      <Crown className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-amber-700">Pro Tip</p>
                        <p className="text-[11px] text-muted-foreground">
                          Upgrade to unlock AI-generated service descriptions, promotional copy, and advanced layout suggestions.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button variant="ghost" onClick={() => setStep("details")} className="gap-1">
                      <ArrowLeft className="h-3.5 w-3.5" /> Back
                    </Button>
                    <Button className="flex-1 gap-2" onClick={handleGenerate}>
                      <Sparkles className="h-4 w-4" />
                      Generate My Card
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ── Step: Generating ── */}
              {step === "generating" && (
                <motion.div key="generating" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }} className="py-16 text-center space-y-6">
                  <div className="relative inline-flex">
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    </div>
                    <motion.div
                      className="absolute -inset-3 rounded-3xl border-2 border-primary/20"
                      animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">Designing your card…</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      AI is crafting sections, content, and styling
                    </p>
                  </div>
                  <div className="space-y-2 max-w-xs mx-auto">
                    {[
                      "Analyzing your business type…",
                      "Generating service descriptions…",
                      "Selecting color palette…",
                      "Building sections layout…",
                    ].map((text, i) => (
                      <motion.div
                        key={text}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 1.2, duration: 0.3 }}
                        className="flex items-center gap-2 text-xs text-muted-foreground"
                      >
                        <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                        {text}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── Step: Done ── */}
              {step === "done" && generatedResult && (
                <motion.div key="done" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }} className="space-y-4 pt-2">
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center space-y-2">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                    <h3 className="text-base font-bold">Your card is ready!</h3>
                    <p className="text-sm text-muted-foreground">
                      Here's what we created. Click "Load into Builder" to start customizing.
                    </p>
                  </div>

                  {/* Preview of generated content */}
                  <div className="space-y-2.5">
                    <div className="rounded-lg border border-border p-3 space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">Tagline</p>
                      <p className="text-sm font-medium">{generatedResult.hero.tagline}</p>
                    </div>

                    <div className="rounded-lg border border-border p-3 space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">Services ({generatedResult.services.length})</p>
                      <div className="flex flex-wrap gap-1">
                        {generatedResult.services.map((s) => (
                          <Badge key={s.name} variant="secondary" className="text-[10px]">{s.name}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-lg border border-border p-3 space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">Sections</p>
                      <p className="text-xs text-muted-foreground">
                        {generatedResult.sections_order.join(" → ")}
                      </p>
                    </div>

                    <div className="rounded-lg border border-border p-3 space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">Theme</p>
                      <div className="flex items-center gap-1.5">
                        {[generatedResult.theme.primary_color, generatedResult.theme.secondary_color, generatedResult.theme.accent_color, generatedResult.theme.background_color].map((c, i) => (
                          <div key={i} className="h-6 w-6 rounded-md border border-border" style={{ background: c }} />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="ghost" onClick={() => { resetState(); setStep("intro"); }}>
                      Start Over
                    </Button>
                    <Button className="flex-1 gap-2" onClick={handleApply}>
                      <Sparkles className="h-4 w-4" />
                      Load into Builder
                    </Button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
