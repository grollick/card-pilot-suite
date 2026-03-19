import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles,
  ArrowRight,
  Phone,
  MessageSquare,
  Mail,
  Calendar,
  MapPin,
  Star,
  Camera,
  ChevronRight,
  Check,
  Loader2,
  UserPlus,
  Quote,
} from "lucide-react";
import { toast } from "sonner";

const PROFESSIONS = [
  "Contractor", "Realtor", "Barber", "Photographer",
  "Landscaper", "Cleaner", "Consultant", "Personal Trainer",
  "Electrician", "Plumber", "Painter", "HVAC Tech",
];

interface GeneratedContent {
  bio: string;
  about: string;
  tagline: string;
  cta_text: string;
  services: string[];
  instagram_bio: string;
}

/* ── Highlight tooltip wrapper ── */
function FeatureHighlight({ children, tip, delay }: { children: React.ReactNode; tip: string; delay: number }) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip defaultOpen>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, duration: 0.3 }}
          >
            {children}
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-[180px] text-center">
          <p className="text-xs">{tip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/* ── AI-generated card preview ── */
function AICardPreview({ company, profession, city, content }: {
  company: string;
  profession: string;
  city: string;
  content: GeneratedContent;
}) {
  const initials = company
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "CP";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-[370px] mx-auto"
    >
      <div className="rounded-[2.5rem] border border-border bg-card shadow-xl overflow-hidden">
        {/* Notch */}
        <div className="flex justify-center pt-3 pb-1 bg-card">
          <div className="w-28 h-5 bg-foreground/10 rounded-full" />
        </div>

        <div className="bg-gradient-to-b from-muted/30 to-card pb-6">
          {/* Cover */}
          <div className="h-28 bg-gradient-to-r from-primary to-accent relative">
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
              <div className="h-20 w-20 rounded-full bg-card border-4 border-card shadow-lg flex items-center justify-center">
                <span className="text-xl font-bold text-foreground">{initials}</span>
              </div>
            </div>
          </div>

          {/* Identity */}
          <div className="text-center mt-12 px-5">
            <h3 className="text-lg font-bold text-foreground">{company}</h3>
            <p className="text-sm text-muted-foreground font-medium">{profession}</p>
            {city && (
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" /> {city}
              </p>
            )}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xs text-muted-foreground mt-2 italic"
            >
              {content.tagline}
            </motion.p>
          </div>

          {/* Action buttons with tooltips */}
          <div className="grid grid-cols-3 gap-2 px-5 mt-5">
            <FeatureHighlight tip="Customers tap to call you directly" delay={0.5}>
              <div className="flex items-center justify-center gap-1.5 rounded-lg bg-primary text-primary-foreground py-2.5 text-xs font-medium cursor-pointer hover:scale-[1.04] active:scale-95 transition-transform">
                <Phone className="h-3.5 w-3.5" /> Call
              </div>
            </FeatureHighlight>
            <FeatureHighlight tip="One-tap texting for instant contact" delay={0.65}>
              <div className="flex items-center justify-center gap-1.5 rounded-lg bg-primary text-primary-foreground py-2.5 text-xs font-medium cursor-pointer hover:scale-[1.04] active:scale-95 transition-transform">
                <MessageSquare className="h-3.5 w-3.5" /> Text
              </div>
            </FeatureHighlight>
            <FeatureHighlight tip="Visitors can email you right from your card" delay={0.8}>
              <div className="flex items-center justify-center gap-1.5 rounded-lg bg-primary text-primary-foreground py-2.5 text-xs font-medium cursor-pointer hover:scale-[1.04] active:scale-95 transition-transform">
                <Mail className="h-3.5 w-3.5" /> Email
              </div>
            </FeatureHighlight>
          </div>

          {/* Bio */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="px-5 mt-5"
          >
            <p className="text-xs text-muted-foreground leading-relaxed">{content.bio}</p>
          </motion.div>

          {/* Services */}
          <div className="px-5 mt-5">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Services</h4>
            <div className="grid grid-cols-2 gap-2">
              {content.services.map((s, i) => (
                <motion.div
                  key={s}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground"
                >
                  <ChevronRight className="h-3 w-3 text-primary" /> {s}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Booking CTA */}
          <div className="px-5 mt-5">
            <FeatureHighlight tip="Customers can book appointments directly from your card" delay={1}>
              <div className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold cursor-pointer hover:scale-[1.02] active:scale-95 transition-transform">
                <Calendar className="h-4 w-4" /> {content.cta_text || "Book Appointment"}
              </div>
            </FeatureHighlight>
          </div>

          {/* Lead capture hint */}
          <div className="px-5 mt-5">
            <FeatureHighlight tip="Capture leads automatically when visitors fill this out" delay={1.2}>
              <div className="rounded-xl border border-dashed border-primary/30 bg-primary/[0.03] p-4 text-center">
                <UserPlus className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Lead Capture Form</p>
              </div>
            </FeatureHighlight>
          </div>

          {/* Gallery */}
          <div className="px-5 mt-5">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Gallery</h4>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-square rounded-lg bg-muted flex items-center justify-center">
                  <Camera className="h-5 w-5 text-muted-foreground/30" />
                </div>
              ))}
            </div>
          </div>

          {/* AI testimonial */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
            className="px-5 mt-5"
          >
            <div className="rounded-xl bg-muted/50 border border-border p-4">
              <Quote className="h-4 w-4 text-primary mb-1" />
              <p className="text-xs text-foreground italic leading-relaxed">
                "Highly professional service and amazing results. Would recommend to anyone!"
              </p>
              <div className="flex items-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-3 w-3 fill-warning text-warning" />
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Home indicator */}
        <div className="flex justify-center py-2 bg-card">
          <div className="w-32 h-1 bg-foreground/15 rounded-full" />
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main component ── */

export default function InstantCardGenerator() {
  const [company, setCompany] = useState("");
  const [profession, setProfession] = useState("");
  const [city, setCity] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [content, setContent] = useState<GeneratedContent | null>(null);

  const canGenerate = company.trim().length > 1 && profession !== "";

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-card-content", {
        body: { profession, name: company, company, city },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setContent(data.content);
    } catch (err: any) {
      console.error("AI generation error:", err);
      toast.error(err.message || "Failed to generate card. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSignup = () => {
    try {
      localStorage.setItem(
        "guzzl-pro_demo",
        JSON.stringify({ profession, name: company, company, city, style: "Modern", aiContent: content })
      );
    } catch {}
    window.location.href = "/onboarding";
  };

  return (
    <section id="instant-generator" className="py-20 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-primary/[0.02] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative">
        <AnimatePresence mode="wait">
          {!content ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-xl mx-auto text-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
                <Sparkles className="h-4 w-4" /> AI-Powered
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3 leading-tight">
                Create Your Smart Business Card Instantly
              </h2>
              <p className="text-muted-foreground mb-10 max-w-md mx-auto">
                Enter your business name and profession to generate a preview of your card in seconds.
              </p>

              {/* Inputs */}
              <div className="space-y-4 text-left max-w-sm mx-auto">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Business Name *</label>
                  <Input
                    placeholder="Gary's Landscaping"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="h-12 text-base"
                    maxLength={80}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Profession *</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {PROFESSIONS.map((p) => (
                      <button
                        key={p}
                        onClick={() => setProfession(p)}
                        className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                          profession === p
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card text-foreground hover:border-primary/40"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">City <span className="text-muted-foreground font-normal">(optional)</span></label>
                  <Input
                    placeholder="Austin, TX"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="h-12 text-base"
                    maxLength={50}
                  />
                </div>
              </div>

              <Button
                size="lg"
                className="shadow-glow mt-8 px-10 py-6 h-auto text-base"
                disabled={!canGenerate || isGenerating}
                onClick={handleGenerate}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Generating…
                  </>
                ) : (
                  <>
                    Generate My Card <Sparkles className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col lg:flex-row items-center justify-center gap-12"
            >
              {/* Preview */}
              <AICardPreview company={company} profession={profession} city={city} content={content} />

              {/* CTA panel */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="max-w-sm text-center lg:text-left"
              >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-success/10 text-success text-sm font-medium mb-4">
                  <Check className="h-4 w-4" /> Your card is ready
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                  Publish it and start capturing customers.
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                  Create your free account to go live. We'll carry over everything you've set up — zero rework.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button size="lg" className="shadow-glow flex-1" onClick={handleSignup}>
                    Create My Card <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => { setContent(null); setProfession(""); setCompany(""); setCity(""); }}
                  >
                    Try Again
                  </Button>
                </div>

                {/* Trust badges */}
                <div className="flex items-center justify-center lg:justify-start gap-4 mt-6 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Check className="h-3 w-3 text-success" /> Free forever plan</span>
                  <span className="flex items-center gap-1"><Check className="h-3 w-3 text-success" /> No credit card</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
