import { useState } from "react";
import GuzzlLogo from "@/components/brand/GuzzlLogo";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Loader2, Globe, Check, Wand2, Palette, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { pickStylePackKey } from "@/lib/stylePackSelection";
import { getBestTemplateForProfession, getTemplate, CARD_TEMPLATES } from "@/lib/cardTemplates";

type Phase = "input" | "generating" | "ready";

const GENERATION_STEPS = [
  { label: "Analyzing your business", icon: Sparkles },
  { label: "Generating content", icon: PenLine },
  { label: "Applying design", icon: Palette },
  { label: "Building your card", icon: Wand2 },
];

export default function InstantCardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>("input");
  const [businessName, setBusinessName] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [genStep, setGenStep] = useState(0);

  const canGenerate = businessName.trim().length > 1;

  const handleGenerate = async () => {
    if (!canGenerate || !user) return;
    setPhase("generating");
    setGenStep(0);

    // Animate through steps
    const stepInterval = setInterval(() => {
      setGenStep((prev) => Math.min(prev + 1, GENERATION_STEPS.length - 1));
    }, 1800);

    try {
      const { data, error } = await supabase.functions.invoke("instant-card", {
        body: { business_name: businessName, url: externalUrl || undefined },
      });

      clearInterval(stepInterval);

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const card = data.card;

      // Save to profile
      const handle = businessName.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 20) + Math.floor(Math.random() * 1000);
      const packKey = pickStylePackKey(card.theme?.style === "bold" ? "Bold" : "Modern", "home_trade");

      await supabase.from("profiles").update({
        company: businessName,
        handle,
        profession: card.profession || null,
        style_pack: packKey,
        primary_cta: card.cta_text?.toLowerCase().includes("book") ? "book" : "call",
        bio: card.bio || null,
      } as any).eq("id", user.id);

      // Build sections
      const sectionIds = card.sections_order || ["hero", "about", "services", "testimonials", "gallery", "contact"];
      const sectionsJson = sectionIds.map((id: string) => ({
        id,
        label: id.charAt(0).toUpperCase() + id.slice(1).replace(/_/g, " "),
        enabled: true,
        content: id === "social" && card.social_links ? { links: card.social_links } : undefined,
      }));

      // Save card
      await supabase.from("cards").upsert({
        user_id: user.id,
        theme_json: {
          style_pack: packKey,
          primary_cta: card.cta_text || "call",
          tagline: card.tagline || "",
          about: card.about || "",
          primary_color: card.theme?.primary_color,
          secondary_color: card.theme?.secondary_color,
          accent_color: card.theme?.accent_color,
        },
        sections_json: sectionsJson,
        status: "draft",
      }, { onConflict: "user_id" });

      // Save services
      if (card.services?.length) {
        // Delete existing first to avoid duplicates
        await supabase.from("booking_services").delete().eq("user_id", user.id);
        await supabase.from("booking_services").insert(
          card.services.map((s: any) => ({
            user_id: user.id,
            name: s.name,
            description: s.description || null,
            duration_min: 30,
            active: true,
          }))
        );
      }

      setGenStep(GENERATION_STEPS.length - 1);
      setPhase("ready");
    } catch (err: any) {
      clearInterval(stepInterval);
      console.error("Instant card error:", err);
      toast.error(err.message || "Failed to generate card. Please try again.");
      setPhase("input");
    }
  };

  const handleGoToEditor = () => {
    navigate("/app/card");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">
            <GuzzlLogo to={null} size="xl" />
          </h1>
        </div>

        <motion.div
          className="rounded-2xl border border-border bg-card shadow-lg p-8"
          layout
        >
          <AnimatePresence mode="wait">
            {/* INPUT PHASE */}
            {phase === "input" && (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="mx-auto h-14 w-14 rounded-2xl flex items-center justify-center bg-primary/10">
                    <Sparkles className="h-7 w-7 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">
                    Generate Your Card Instantly
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Just your business name — we'll create everything else with AI.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      Business Name *
                    </label>
                    <Input
                      placeholder="e.g. Gary's Landscaping"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="h-12 text-base"
                      maxLength={80}
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      Website or Social Link
                      <span className="text-muted-foreground font-normal ml-1">(optional)</span>
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="https://yourbusiness.com or Instagram link"
                        value={externalUrl}
                        onChange={(e) => setExternalUrl(e.target.value)}
                        className="h-12 text-base pl-10"
                        maxLength={200}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1.5">
                      We'll import your content, images, and services automatically
                    </p>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full h-12 text-base font-semibold gap-2"
                  disabled={!canGenerate}
                  onClick={handleGenerate}
                >
                  Generate My Card <Sparkles className="h-5 w-5" />
                </Button>

                <button
                  onClick={() => navigate("/onboarding")}
                  className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Or set up manually →
                </button>
              </motion.div>
            )}

            {/* GENERATING PHASE */}
            {phase === "generating" && (
              <motion.div
                key="generating"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8 py-4"
              >
                <div className="text-center space-y-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="mx-auto h-14 w-14 rounded-2xl flex items-center justify-center bg-primary/10"
                  >
                    <Sparkles className="h-7 w-7 text-primary" />
                  </motion.div>
                  <h2 className="text-lg font-bold text-foreground">
                    Building your card…
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {externalUrl ? "Analyzing your website and generating content" : "Creating professional content with AI"}
                  </p>
                </div>

                <div className="space-y-3">
                  {GENERATION_STEPS.map((s, i) => {
                    const Icon = s.icon;
                    const active = i === genStep;
                    const done = i < genStep;
                    return (
                      <motion.div
                        key={s.label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.15 }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                          active
                            ? "border-primary bg-primary/5"
                            : done
                            ? "border-border bg-muted/30"
                            : "border-transparent"
                        }`}
                      >
                        {done ? (
                          <Check className="h-5 w-5 text-primary" />
                        ) : active ? (
                          <Loader2 className="h-5 w-5 text-primary animate-spin" />
                        ) : (
                          <Icon className="h-5 w-5 text-muted-foreground/40" />
                        )}
                        <span className={`text-sm font-medium ${
                          active ? "text-foreground" : done ? "text-muted-foreground" : "text-muted-foreground/40"
                        }`}>
                          {s.label}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* READY PHASE */}
            {phase === "ready" && (
              <motion.div
                key="ready"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="mx-auto h-16 w-16 rounded-full flex items-center justify-center bg-primary/10"
                >
                  <Check className="h-8 w-8 text-primary" />
                </motion.div>

                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-foreground">
                    Your card is ready! 🎉
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    We've generated your card with professional content, services, and styling. Open the editor to customize it.
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    size="lg"
                    className="w-full h-12 text-base font-semibold gap-2"
                    onClick={handleGoToEditor}
                  >
                    Open Card Editor <ArrowRight className="h-5 w-5" />
                  </Button>

                  <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Palette className="h-3 w-3" /> Change style
                    </span>
                    <span className="flex items-center gap-1">
                      <PenLine className="h-3 w-3" /> Edit content
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
