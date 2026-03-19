import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Check,
  Phone,
  MessageSquare,
  Mail,
  Calendar,
  MapPin,
  ChevronRight,
  Star,
  Camera,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

/* ── profession data ── */
const PROFESSIONS = [
  { label: "Contractor", icon: "🔨" },
  { label: "Realtor", icon: "🏠" },
  { label: "Barber", icon: "✂️" },
  { label: "Photographer", icon: "📷" },
  { label: "Landscaper", icon: "🌿" },
  { label: "Cleaner", icon: "🧹" },
  { label: "Consultant", icon: "💼" },
  { label: "Personal Trainer", icon: "💪" },
];

const TEMPLATES: Record<string, { key: string; label: string; gradient: string }> = {
  Contractor: { key: "contractor", label: "Contractor Pro", gradient: "from-orange-600 to-amber-500" },
  Realtor: { key: "modern", label: "Modern", gradient: "from-primary to-accent" },
  Barber: { key: "bold", label: "Bold", gradient: "from-rose-600 to-orange-500" },
  Photographer: { key: "portfolio", label: "Portfolio", gradient: "from-violet-600 to-indigo-500" },
  Landscaper: { key: "service", label: "Service Pro", gradient: "from-emerald-600 to-teal-500" },
  Cleaner: { key: "service", label: "Service Pro", gradient: "from-sky-600 to-cyan-500" },
  Consultant: { key: "minimal", label: "Minimal", gradient: "from-slate-700 to-slate-500" },
  "Personal Trainer": { key: "bold", label: "Bold", gradient: "from-rose-600 to-pink-500" },
};

const ALL_TEMPLATES = [
  { key: "modern", label: "Modern", gradient: "from-primary to-accent" },
  { key: "service", label: "Service Pro", gradient: "from-emerald-600 to-teal-500" },
  { key: "portfolio", label: "Portfolio", gradient: "from-violet-600 to-indigo-500" },
  { key: "bold", label: "Bold", gradient: "from-rose-600 to-orange-500" },
];

const SERVICE_MAP: Record<string, string[]> = {
  Contractor: ["Renovations", "Kitchen Remodels", "Bathrooms"],
  Realtor: ["Home Buying", "Home Selling", "Market Analysis"],
  Barber: ["Classic Cuts", "Beard Trim", "Hot Towel Shave"],
  Photographer: ["Portraits", "Events", "Commercial"],
  Landscaper: ["Lawn Care", "Garden Design", "Hardscaping"],
  Cleaner: ["Deep Clean", "Regular Clean", "Move-In/Out"],
  Consultant: ["Strategy", "Growth Planning", "Operations"],
  "Personal Trainer": ["1-on-1 Training", "Group Classes", "Nutrition"],
};

/* ── types ── */
interface BuilderData {
  profession: string;
  name: string;
  company: string;
  phone: string;
  city: string;
  template: string;
  templateGradient: string;
}

/* ── animation ── */
const slideVariant = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -30, transition: { duration: 0.2 } },
};

/* ── Live Preview Card ── */
function LivePreview({ data }: { data: BuilderData }) {
  const initials = data.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const services = SERVICE_MAP[data.profession] || ["Service 1", "Service 2", "Service 3"];
  const gradient = data.templateGradient || "from-primary to-accent";

  return (
    <div className="w-full max-w-[340px] mx-auto">
      <div className="rounded-[2rem] border border-border bg-card shadow-xl overflow-hidden">
        {/* Notch */}
        <div className="flex justify-center pt-2.5 pb-1 bg-card">
          <div className="w-24 h-4 bg-foreground/10 rounded-full" />
        </div>

        <div className="pb-5">
          {/* Cover */}
          <div className={`h-24 bg-gradient-to-r ${gradient} relative`}>
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
              <div className="h-16 w-16 rounded-full bg-card border-[3px] border-card shadow-lg flex items-center justify-center">
                <span className="text-base font-bold text-foreground">{initials || "CP"}</span>
              </div>
            </div>
          </div>

          {/* Identity */}
          <div className="text-center mt-10 px-4">
            <h3 className="text-base font-bold text-foreground leading-tight">
              {data.name || "Your Name"}
            </h3>
            {data.company && (
              <p className="text-xs text-muted-foreground font-medium mt-0.5">{data.company}</p>
            )}
            <p className="text-[11px] text-muted-foreground mt-0.5">{data.profession || "Your Profession"}</p>
            {data.city && (
              <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-0.5 mt-0.5">
                <MapPin className="h-2.5 w-2.5" /> {data.city}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-1.5 px-4 mt-4">
            {[
              { icon: Phone, label: "Call" },
              { icon: MessageSquare, label: "Text" },
              { icon: Mail, label: "Email" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium bg-gradient-to-r ${gradient} text-primary-foreground`}
              >
                <Icon className="h-3 w-3" />
                {label}
              </div>
            ))}
          </div>

          {/* Services */}
          {data.profession && (
            <div className="px-4 mt-4">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Services
              </p>
              <div className="space-y-1">
                {services.map((s) => (
                  <div
                    key={s}
                    className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-[11px] font-medium text-foreground"
                  >
                    <ChevronRight className="h-2.5 w-2.5 text-muted-foreground" />
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Book CTA */}
          <div className="px-4 mt-3">
            <div
              className={`w-full flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold bg-gradient-to-r ${gradient} text-primary-foreground`}
            >
              <Calendar className="h-3.5 w-3.5" /> Book Appointment
            </div>
          </div>

          {/* Gallery placeholder */}
          <div className="px-4 mt-4">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Gallery
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="aspect-square rounded-md bg-muted flex items-center justify-center"
                >
                  <Camera className="h-4 w-4 text-muted-foreground/30" />
                </div>
              ))}
            </div>
          </div>

          {/* Stars */}
          <div className="flex items-center gap-0.5 justify-center mt-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="h-3 w-3 fill-warning text-warning" />
            ))}
            <span className="text-[10px] text-muted-foreground ml-1">5.0</span>
          </div>
        </div>

        {/* Home indicator */}
        <div className="flex justify-center py-1.5 bg-card">
          <div className="w-28 h-1 bg-foreground/15 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/* ── Main Builder ── */
export default function InteractiveCardBuilder() {
  const isMobile = useIsMobile();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<BuilderData>({
    profession: "",
    name: "",
    company: "",
    phone: "",
    city: "",
    template: "modern",
    templateGradient: "from-primary to-accent",
  });
  const [done, setDone] = useState(false);

  const recommended = useMemo(
    () => TEMPLATES[data.profession] || ALL_TEMPLATES[0],
    [data.profession]
  );

  const canNext =
    step === 0
      ? data.profession !== ""
      : step === 1
        ? data.name.trim().length > 1
        : true;

  const handleNext = () => {
    if (step === 0 && data.template === "modern") {
      // Auto-apply recommended template when moving from profession step
      const rec = TEMPLATES[data.profession];
      if (rec) setData((d) => ({ ...d, template: rec.key, templateGradient: rec.gradient }));
    }
    if (step < 2) setStep(step + 1);
    else setDone(true);
  };

  const handlePersistAndSignup = () => {
    try {
      localStorage.setItem("guzzl-pro_demo", JSON.stringify(data));
    } catch {}
    window.location.href = "/onboarding";
  };

  /* ── Done state ── */
  if (done) {
    return (
      <section className="py-16 md:py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-success/10 text-success text-sm font-medium mb-4">
              <Check className="h-4 w-4" /> Your card is ready!
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3">
              Here's your guzzl.pro preview
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Create your free account to publish it and start getting leads.
            </p>
          </motion.div>

          <div className="flex flex-col lg:flex-row items-center justify-center gap-10">
            <LivePreview data={data} />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
              className="flex flex-col items-center lg:items-start gap-4 max-w-sm text-center lg:text-left"
            >
              <h3 className="text-2xl font-bold text-foreground">
                Your next customer is waiting.
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Publish your card, share it anywhere, and start converting visitors into real customers — all for free.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Button size="lg" className="shadow-glow flex-1 rounded-xl" onClick={handlePersistAndSignup}>
                  Create Free Account <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => {
                    setDone(false);
                    setStep(0);
                  }}
                >
                  Start Over
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    );
  }

  /* ── Builder ── */
  return (
    <section id="card-builder" className="py-16 md:py-24 px-4 relative overflow-hidden bg-muted/40">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent pointer-events-none" />
      <div className="max-w-5xl mx-auto relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
            <Sparkles className="h-3 w-3" /> No credit card required
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-2">
            Build Your Smart Business Card in 30 Seconds
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto text-sm">
            See what your card looks like — instantly, no signup required.
          </p>
        </motion.div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {["Profession", "Details", "Template"].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    i <= step
                      ? "bg-primary text-primary-foreground"
                      : "bg-border text-muted-foreground"
                  }`}
                >
                  {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span className="text-xs font-medium text-muted-foreground hidden sm:block">
                  {label}
                </span>
              </div>
              {i < 2 && (
                <div
                  className={`w-8 sm:w-12 h-0.5 rounded-full transition-colors ${
                    i < step ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Split layout: inputs + preview */}
        <div className={`flex ${isMobile ? "flex-col" : "flex-row"} gap-8 items-start`}>
          {/* Left: inputs */}
          <div className={`${isMobile ? "w-full" : "w-1/2"} min-h-[380px]`}>
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <AnimatePresence mode="wait">
                {step === 0 && (
                  <motion.div key="s0" {...slideVariant}>
                    <h3 className="text-lg font-bold text-foreground mb-1">What do you do?</h3>
                    <p className="text-sm text-muted-foreground mb-6">Choose your profession</p>
                    <div className="grid grid-cols-2 gap-2.5">
                      {PROFESSIONS.map((p) => (
                        <button
                          key={p.label}
                          onClick={() => setData((d) => ({ ...d, profession: p.label }))}
                          className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${
                            data.profession === p.label
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border bg-background hover:border-primary/30"
                          }`}
                        >
                          <span className="text-xl">{p.icon}</span>
                          <span className="text-sm font-medium text-foreground">{p.label}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {step === 1 && (
                  <motion.div key="s1" {...slideVariant}>
                    <h3 className="text-lg font-bold text-foreground mb-1">Your details</h3>
                    <p className="text-sm text-muted-foreground mb-6">Just the basics — 10 seconds</p>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">
                          Your Name *
                        </label>
                        <Input
                          placeholder="John Smith"
                          value={data.name}
                          onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
                          className="h-11"
                          maxLength={60}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">
                          Business Name
                        </label>
                        <Input
                          placeholder="Smith & Sons Construction"
                          value={data.company}
                          onChange={(e) => setData((d) => ({ ...d, company: e.target.value }))}
                          className="h-11"
                          maxLength={80}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1.5 block">
                            Phone
                          </label>
                          <Input
                            placeholder="(555) 123-4567"
                            value={data.phone}
                            onChange={(e) => setData((d) => ({ ...d, phone: e.target.value }))}
                            className="h-11"
                            maxLength={20}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1.5 block">
                            City
                          </label>
                          <Input
                            placeholder="Austin, TX"
                            value={data.city}
                            onChange={(e) => setData((d) => ({ ...d, city: e.target.value }))}
                            className="h-11"
                            maxLength={50}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="s2" {...slideVariant}>
                    <h3 className="text-lg font-bold text-foreground mb-1">Pick your style</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      We recommend <strong>{recommended.label}</strong> for{" "}
                      {data.profession || "your profession"}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {ALL_TEMPLATES.map((t) => {
                        const isRecommended = t.key === recommended.key;
                        const isSelected = data.template === t.key;
                        return (
                          <button
                            key={t.key}
                            onClick={() =>
                              setData((d) => ({
                                ...d,
                                template: t.key,
                                templateGradient: t.gradient,
                              }))
                            }
                            className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                              isSelected
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-border bg-background hover:border-primary/30"
                            }`}
                          >
                            <div
                              className={`h-2.5 w-10 rounded-full bg-gradient-to-r ${t.gradient} mb-3`}
                            />
                            <span className="text-sm font-semibold text-foreground block">
                              {t.label}
                            </span>
                            {isRecommended && (
                              <span className="text-[10px] font-medium text-primary mt-0.5 block">
                                Recommended
                              </span>
                            )}
                            {isSelected && (
                              <div className="absolute top-2.5 right-2.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                <Check className="h-3 w-3 text-primary-foreground" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Nav buttons */}
              <div className="flex items-center gap-3 mt-8">
                {step > 0 && (
                  <Button variant="outline" onClick={() => setStep(step - 1)} className="rounded-xl">
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                )}
                <Button
                  className="shadow-glow rounded-xl flex-1"
                  disabled={!canNext}
                  onClick={handleNext}
                >
                  {step === 2 ? (
                    <>
                      Generate My Card <Sparkles className="h-4 w-4 ml-1" />
                    </>
                  ) : (
                    <>
                      Next <ArrowRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Right: live preview */}
          <div
            className={`${isMobile ? "w-full" : "w-1/2"} flex items-start justify-center ${
              isMobile ? "" : "sticky top-24"
            }`}
          >
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-br from-primary/[0.04] to-accent/[0.04] rounded-3xl blur-xl -z-10" />
              <LivePreview data={data} />
              <p className="text-[10px] text-muted-foreground text-center mt-3">
                Live preview • Updates as you type
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
