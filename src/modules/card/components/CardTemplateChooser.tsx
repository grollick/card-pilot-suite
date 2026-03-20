import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Hammer, Scissors, Home, Briefcase, Sparkles, ArrowRight, Check,
  Camera, Dumbbell, Star, Shield, Smartphone, Monitor,
  ChevronRight, Zap, Lock, Crown, X, Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CARD_TEMPLATES, STYLE_PRESETS, type StylePreset } from "@/lib/cardTemplates";
import { usePlanLimits } from "@/hooks/usePlanLimits";

interface TemplateOption {
  id: string;
  templateId: string;
  label: string;
  subtitle: string;
  description: string;
  icon: typeof Hammer;
  accentColor: string;
  bgGradient: string;
  highlights: string[];
  previewSections: Array<{ label: string; height: number }>;
  ctaLabels: string[];
  sampleTagline: string;
  sampleReview: string;
  premium?: boolean;
}

const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    id: "contractor",
    templateId: "contractor_template",
    label: "Pro Contractor",
    subtitle: "Lead Generator",
    description: "Purpose-built for contractors who want more jobs. Quote calculator, project gallery, and verified reviews.",
    icon: Hammer,
    accentColor: "hsl(25, 95%, 53%)",
    bgGradient: "linear-gradient(135deg, hsl(25, 95%, 53%) 0%, hsl(15, 90%, 45%) 100%)",
    highlights: ["Instant Quotes", "Before/After Gallery", "5-Star Reviews", "Lead Capture"],
    previewSections: [
      { label: "Hero + CTA", height: 48 },
      { label: "Services", height: 28 },
      { label: "Projects", height: 32 },
      { label: "Reviews", height: 24 },
      { label: "Get a Quote", height: 20 },
    ],
    ctaLabels: ["Call Now", "Get Quote"],
    sampleTagline: "Licensed, insured, and ready to build",
    sampleReview: "Incredible attention to detail. On time and under budget.",
    premium: true,
  },
  {
    id: "barber",
    templateId: "barber_template",
    label: "Elite Barber",
    subtitle: "Booking Focused",
    description: "Bold and confident. One-tap booking, style gallery, and 5-star reviews that keep clients coming back.",
    icon: Scissors,
    accentColor: "hsl(262, 83%, 58%)",
    bgGradient: "linear-gradient(135deg, hsl(262, 83%, 58%) 0%, hsl(280, 70%, 45%) 100%)",
    highlights: ["One-Tap Booking", "Style Gallery", "Service Menu", "Client Reviews"],
    previewSections: [
      { label: "Hero + CTA", height: 48 },
      { label: "Book Now", height: 24 },
      { label: "Services & Pricing", height: 32 },
      { label: "Gallery", height: 28 },
      { label: "Reviews", height: 20 },
    ],
    ctaLabels: ["Book Now", "Call"],
    sampleTagline: "Sharp cuts. Clean fades. Walk out confident.",
    sampleReview: "Best barber I've ever had. Won't go anywhere else.",
    premium: true,
  },
  {
    id: "realtor",
    templateId: "realtor_template",
    label: "Premium Realtor",
    subtitle: "Client Capture",
    description: "Trust-forward design. Testimonials, market expertise, and instant scheduling that converts browsers into buyers.",
    icon: Home,
    accentColor: "hsl(199, 89%, 48%)",
    bgGradient: "linear-gradient(135deg, hsl(199, 89%, 48%) 0%, hsl(210, 80%, 40%) 100%)",
    highlights: ["Trust Signals", "Market Expertise", "Instant Scheduling", "Client Testimonials"],
    previewSections: [
      { label: "Hero + CTA", height: 48 },
      { label: "About & Expertise", height: 28 },
      { label: "Testimonials", height: 28 },
      { label: "Services", height: 24 },
      { label: "Schedule Showing", height: 24 },
    ],
    ctaLabels: ["Call Agent", "Schedule"],
    sampleTagline: "Your trusted partner in finding the perfect home",
    sampleReview: "Found our dream home in under three weeks.",
    premium: true,
  },
  {
    id: "photographer",
    templateId: "photographer_template",
    label: "Studio Pro",
    subtitle: "Visual Storyteller",
    description: "Let your images speak volumes. Full-bleed gallery, elegant presentation, and seamless booking.",
    icon: Camera,
    accentColor: "hsl(340, 82%, 52%)",
    bgGradient: "linear-gradient(135deg, hsl(340, 82%, 52%) 0%, hsl(320, 70%, 42%) 100%)",
    highlights: ["Full Gallery", "Portfolio Display", "Session Booking", "Client Stories"],
    previewSections: [
      { label: "Hero + CTA", height: 48 },
      { label: "Gallery Grid", height: 36 },
      { label: "Packages", height: 28 },
      { label: "Client Love", height: 24 },
      { label: "Book Session", height: 20 },
    ],
    ctaLabels: ["Book Session", "Inquire"],
    sampleTagline: "Every frame tells your story",
    sampleReview: "Pure artistry — we'll treasure these forever.",
    premium: true,
  },
  {
    id: "wellness",
    templateId: "booking_first",
    label: "Wellness Pro",
    subtitle: "Appointment Magnet",
    description: "Designed for appointment-based businesses. Service menu, instant booking, and client reviews to fill your calendar.",
    icon: Dumbbell,
    accentColor: "hsl(142, 71%, 45%)",
    bgGradient: "linear-gradient(135deg, hsl(142, 71%, 45%) 0%, hsl(160, 60%, 38%) 100%)",
    highlights: ["Instant Booking", "Service Menu", "Client Results", "Social Proof"],
    previewSections: [
      { label: "Hero + CTA", height: 48 },
      { label: "Book Appointment", height: 24 },
      { label: "Services & Pricing", height: 32 },
      { label: "Transformations", height: 28 },
      { label: "Reviews", height: 20 },
    ],
    ctaLabels: ["Book Now", "Call"],
    sampleTagline: "Your next appointment is one tap away",
    sampleReview: "Best experience I've had. Booking was instant.",
  },
  {
    id: "general",
    templateId: "modern_professional",
    label: "Pro Business",
    subtitle: "Growth Engine",
    description: "A polished, conversion-optimized card for any industry. Strong CTA placement and trust signals that turn visitors into clients.",
    icon: Briefcase,
    accentColor: "hsl(221, 83%, 53%)",
    bgGradient: "linear-gradient(135deg, hsl(221, 83%, 53%) 0%, hsl(240, 70%, 45%) 100%)",
    highlights: ["Lead Capture", "Trust Signals", "Service Showcase", "Smart CTAs"],
    previewSections: [
      { label: "Hero + CTA", height: 48 },
      { label: "About", height: 24 },
      { label: "Services", height: 32 },
      { label: "Testimonials", height: 24 },
      { label: "Contact", height: 24 },
    ],
    ctaLabels: ["Get Started", "Call"],
    sampleTagline: "Trusted by hundreds of local customers",
    sampleReview: "Most professional service I've experienced.",
  },
];

interface Props {
  onSelect: (templateId: string) => void;
  onSkip: () => void;
  professionName?: string;
}

export default function CardTemplateChooser({ onSelect, onSkip, professionName }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">("mobile");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [lockedTemplateName, setLockedTemplateName] = useState("");
  const { hasFeature } = usePlanLimits();

  const hasPremiumTemplates = hasFeature("premium_templates");
  const selectedOption = TEMPLATE_OPTIONS.find((o) => o.id === selected);

  const handleTemplateClick = (option: TemplateOption) => {
    if (option.premium && !hasPremiumTemplates) {
      setLockedTemplateName(option.label);
      setShowUpgradeModal(true);
      return;
    }
    setSelected(option.id);
  };

  const handleContinue = () => {
    if (selectedOption) onSelect(selectedOption.templateId);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="min-h-full flex flex-col">
        {/* Top bar */}
        <div className="shrink-0 border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-sm font-semibold text-foreground">Card Builder</span>
            </div>
            <Button variant="ghost" size="sm" className="text-muted-foreground text-xs" onClick={onSkip}>
              Start from scratch <ChevronRight className="h-3 w-3 ml-0.5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-8 sm:mb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 text-primary text-xs font-medium mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              Premium Templates
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2" style={{ lineHeight: 1.1 }}>
              Launch your card in seconds
            </h1>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Choose a professionally designed template built to convert. Every layout is fully customizable.
            </p>
          </motion.div>

          {/* Two-column: grid + preview */}
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Template grid */}
            <div className="flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TEMPLATE_OPTIONS.map((option, i) => {
                  const isSelected = selected === option.id;
                  const isLocked = option.premium && !hasPremiumTemplates;
                  const Icon = option.icon;

                  return (
                    <motion.button
                      key={option.id}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                      onClick={() => handleTemplateClick(option)}
                      className={`group relative text-left rounded-xl border p-4 transition-all duration-200 active:scale-[0.97] ${
                        isSelected
                          ? "border-primary/60 bg-primary/[0.03] shadow-lg ring-1 ring-primary/15"
                          : isLocked
                          ? "border-border/30 bg-muted/20 hover:border-border/50 hover:shadow-sm"
                          : "border-border/50 hover:border-border hover:shadow-md bg-card"
                      }`}
                    >
                      {/* Top row: icon + name */}
                      <div className="flex items-start gap-3 mb-3">
                        <div
                          className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${isLocked ? "opacity-60" : ""}`}
                          style={{ background: `${option.accentColor}12` }}
                        >
                          <Icon className="h-5 w-5" style={{ color: option.accentColor }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h3 className={`text-sm font-bold leading-tight ${isLocked ? "text-muted-foreground" : "text-foreground"}`}>
                              {option.label}
                            </h3>
                            {isLocked && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary">
                                <Crown className="h-2.5 w-2.5" /> PRO
                              </span>
                            )}
                          </div>
                          <span className={`text-[11px] font-medium ${isLocked ? "text-muted-foreground/60" : ""}`} style={isLocked ? {} : { color: option.accentColor }}>
                            {option.subtitle}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className={`text-xs leading-relaxed mb-3 line-clamp-2 ${isLocked ? "text-muted-foreground/50" : "text-muted-foreground"}`}>
                        {option.description}
                      </p>

                      {/* Highlight pills */}
                      <div className="flex flex-wrap gap-1">
                        {option.highlights.slice(0, 3).map((h) => (
                          <span
                            key={h}
                            className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${isLocked ? "bg-muted/40 text-muted-foreground/40" : "bg-muted/70 text-muted-foreground"}`}
                          >
                            {h}
                          </span>
                        ))}
                        {option.highlights.length > 3 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted/50 text-muted-foreground/60">
                            +{option.highlights.length - 3}
                          </span>
                        )}
                      </div>

                      {/* Lock overlay */}
                      {isLocked && (
                        <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-muted/80 flex items-center justify-center">
                          <Lock className="h-3 w-3 text-muted-foreground/60" />
                        </div>
                      )}

                      {/* Selection check */}
                      {isSelected && !isLocked && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 20 }}
                          className="absolute top-3 right-3 h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow-sm"
                        >
                          <Check className="h-3.5 w-3.5 text-primary-foreground" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Style Presets */}
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="h-4 w-4 text-muted-foreground/60" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Style Presets</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {STYLE_PRESETS.map((preset) => {
                    const isPresetLocked = preset.premium && !hasPremiumTemplates;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => isPresetLocked ? (setLockedTemplateName(preset.name + " Style"), setShowUpgradeModal(true)) : null}
                        className={`relative rounded-lg border p-3 text-left transition-all duration-200 ${
                          isPresetLocked
                            ? "border-border/30 bg-muted/10 cursor-pointer hover:border-border/50"
                            : "border-border/50 bg-card hover:shadow-sm"
                        }`}
                      >
                        {/* Color swatches */}
                        <div className="flex gap-1 mb-2">
                          {Object.values(preset.palette).map((color, idx) => (
                            <div
                              key={idx}
                              className={`h-5 flex-1 rounded-sm ${isPresetLocked ? "opacity-40" : ""}`}
                              style={{ background: color }}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={`text-[11px] font-semibold ${isPresetLocked ? "text-muted-foreground/50" : "text-foreground"}`}>
                            {preset.name}
                          </span>
                          {isPresetLocked && (
                            <Crown className="h-2.5 w-2.5 text-primary/60" />
                          )}
                        </div>
                        <p className={`text-[10px] ${isPresetLocked ? "text-muted-foreground/30" : "text-muted-foreground/60"}`}>
                          {preset.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Preview panel */}
            <div className="lg:w-[320px] shrink-0">
              <div className="sticky top-20">
                <AnimatePresence mode="wait">
                  {selectedOption ? (
                    <motion.div
                      key={selectedOption.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-lg"
                    >
                      {/* Preview header */}
                      <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Preview</span>
                        <div className="flex gap-0.5 rounded-lg border border-border/40 bg-muted/30 p-0.5">
                          <button
                            onClick={() => setPreviewDevice("mobile")}
                            className={`p-1.5 rounded-md transition-all ${previewDevice === "mobile" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
                          >
                            <Smartphone className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => setPreviewDevice("desktop")}
                            className={`p-1.5 rounded-md transition-all ${previewDevice === "desktop" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
                          >
                            <Monitor className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {/* Mini card preview */}
                      <div className="p-4">
                        <div
                          className={`mx-auto rounded-xl overflow-hidden border border-border/30 bg-background shadow-inner transition-all duration-300 ${
                            previewDevice === "mobile" ? "w-[200px]" : "w-full"
                          }`}
                        >
                          {/* Hero mock */}
                          <div
                            className="relative"
                            style={{
                              height: previewDevice === "mobile" ? 80 : 64,
                              background: selectedOption.bgGradient,
                            }}
                          >
                            <div className="absolute -bottom-4 left-4 h-10 w-10 rounded-full bg-background border-2 border-background shadow-md flex items-center justify-center">
                              <selectedOption.icon className="h-4 w-4" style={{ color: selectedOption.accentColor }} />
                            </div>
                          </div>

                          <div className="pt-6 pb-3 px-3">
                            <div className="mb-2">
                              <div className="h-2.5 w-24 rounded bg-foreground/80 mb-1" />
                              <div className="h-1.5 w-32 rounded bg-muted-foreground/30" />
                            </div>

                            <div className="flex gap-1.5 mb-3">
                              {selectedOption.ctaLabels.map((cta) => (
                                <div
                                  key={cta}
                                  className="flex-1 h-5 rounded-md flex items-center justify-center"
                                  style={{ background: selectedOption.accentColor }}
                                >
                                  <span className="text-[7px] text-white font-bold">{cta}</span>
                                </div>
                              ))}
                            </div>

                            <div className="space-y-1.5">
                              {selectedOption.previewSections.map((sec, idx) => (
                                <div key={idx} className="rounded-md bg-muted/40 overflow-hidden">
                                  <div className="px-2 py-1">
                                    <span className="text-[7px] font-semibold text-muted-foreground/70">{sec.label}</span>
                                  </div>
                                  <div
                                    className="mx-1.5 mb-1.5 rounded-sm"
                                    style={{
                                      height: sec.height * (previewDevice === "mobile" ? 0.4 : 0.3),
                                      background: `${selectedOption.accentColor}08`,
                                      border: `1px solid ${selectedOption.accentColor}10`,
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Template info */}
                      <div className="px-4 pb-4 space-y-3">
                        <div className="rounded-lg bg-muted/30 p-3">
                          <div className="flex items-center gap-1 mb-1">
                            {[1,2,3,4,5].map(n => (
                              <Star key={n} className="h-2.5 w-2.5 text-amber-500 fill-amber-500" />
                            ))}
                          </div>
                          <p className="text-[11px] text-muted-foreground italic leading-relaxed">
                            "{selectedOption.sampleReview}"
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60">
                          <span className="flex items-center gap-1">
                            <Shield className="h-2.5 w-2.5" /> Verified
                          </span>
                          <span className="flex items-center gap-1">
                            <Sparkles className="h-2.5 w-2.5" /> Conversion optimized
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="rounded-2xl border border-dashed border-border/50 bg-muted/10 p-8 text-center"
                    >
                      <div className="h-12 w-12 rounded-xl bg-muted/30 flex items-center justify-center mx-auto mb-3">
                        <Sparkles className="h-5 w-5 text-muted-foreground/40" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground/60 mb-1">Select a template</p>
                      <p className="text-xs text-muted-foreground/40">Preview will appear here</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10 pb-8"
          >
            <Button
              size="lg"
              className="gap-2 min-w-[220px] h-12 text-[15px] font-semibold shadow-md"
              disabled={!selected}
              onClick={handleContinue}
            >
              Launch with Template <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowUpgradeModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="bg-card rounded-2xl border border-border/50 shadow-2xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Gradient header */}
              <div className="relative bg-gradient-to-br from-primary/90 to-primary px-6 py-8 text-center">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="absolute top-3 right-3 h-7 w-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <X className="h-3.5 w-3.5 text-white" />
                </button>
                <div className="h-12 w-12 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-3">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-lg font-bold text-white mb-1">
                  Unlock {lockedTemplateName}
                </h2>
                <p className="text-sm text-white/70">
                  Premium templates are available on Pro plans
                </p>
              </div>

              {/* Benefits */}
              <div className="px-6 py-5 space-y-3">
                {[
                  { icon: Zap, text: "Set up your card in under 30 seconds" },
                  { icon: Sparkles, text: "Professionally designed, conversion-optimized layouts" },
                  { icon: Star, text: "Premium style presets and design options" },
                  { icon: Shield, text: "Trusted by thousands of local businesses" },
                ].map(({ icon: BenefitIcon, text }) => (
                  <div key={text} className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-lg bg-primary/8 flex items-center justify-center shrink-0 mt-0.5">
                      <BenefitIcon className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm text-foreground/80 leading-relaxed">{text}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="px-6 pb-6 pt-1 space-y-2">
                <Button
                  size="lg"
                  className="w-full h-11 gap-2 font-semibold shadow-md"
                  onClick={() => window.location.href = "/app/pricing"}
                >
                  <Crown className="h-4 w-4" /> Upgrade to Pro
                </Button>
                <p className="text-[11px] text-muted-foreground text-center">
                  One new job pays for your month. Cancel anytime.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
