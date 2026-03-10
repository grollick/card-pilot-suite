import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, ArrowLeft, Sparkles, Check } from "lucide-react";
import DemoCardPreview from "./DemoCardPreview";

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

const STYLES = [
  { key: "Modern", color: "from-blue-500 to-cyan-400", desc: "Clean lines, glass effects" },
  { key: "Elegant", color: "from-amber-600 to-yellow-400", desc: "Luxe feel, editorial layout" },
  { key: "Bold", color: "from-rose-500 to-orange-400", desc: "High contrast, standout colors" },
];

export interface DemoData {
  profession: string;
  name: string;
  company: string;
  phone: string;
  city: string;
  style: string;
}

const fadeSlide = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
  exit: { opacity: 0, x: -40, transition: { duration: 0.25 } },
};

export default function CardDemoBuilder() {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [demoData, setDemoData] = useState<DemoData>({
    profession: "",
    name: "",
    company: "",
    phone: "",
    city: "",
    style: "Modern",
  });
  const [showPreview, setShowPreview] = useState(false);

  const canNext =
    step === 0
      ? demoData.profession !== ""
      : step === 1
        ? demoData.name.trim().length > 1
        : true;

  const handleNext = () => {
    if (step < 2) setStep(step + 1);
    else setShowPreview(true);
  };

  const handlePersistAndSignup = () => {
    try {
      localStorage.setItem("cardpilot_demo", JSON.stringify(demoData));
    } catch {}
    window.location.href = "/onboarding";
  };

  if (showPreview) {
    return (
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 text-green-600 text-sm font-medium mb-4">
              <Check className="h-4 w-4" /> Your card is ready
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Here's your CardPilot preview
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Create your free account to publish it and start getting leads.
            </p>
          </motion.div>

          <div className="flex flex-col lg:flex-row items-center justify-center gap-12">
            <DemoCardPreview data={demoData} />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
              className="flex flex-col items-center lg:items-start gap-4 max-w-sm"
            >
              <h3 className="text-2xl font-bold text-foreground">
                Your next customer is waiting.
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Publish your card, share it anywhere, and start converting visitors into real customers — all for free.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Button size="lg" className="shadow-glow flex-1" onClick={handlePersistAndSignup}>
                  Create My Card <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => { setShowPreview(false); setStep(0); }}>
                  Start Over
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="demo-builder" className="py-24 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] to-transparent pointer-events-none" />
      <div className="max-w-3xl mx-auto text-center relative">
        {!started ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
              <Sparkles className="h-4 w-4" /> Interactive Demo
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
              Build Your Card in 30 Seconds
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
              See what your business card could look like — instantly, no signup required.
            </p>
            <Button size="lg" className="shadow-glow text-base px-8 py-6 h-auto" onClick={() => setStarted(true)}>
              Start Demo <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </motion.div>
        ) : (
          <div>
            {/* Progress indicator */}
            <div className="flex items-center justify-center gap-2 mb-10">
              {[0, 1, 2].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    s <= step ? "bg-primary w-10" : "bg-border w-6"
                  }`}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div key="step0" {...fadeSlide}>
                  <h3 className="text-2xl font-bold text-foreground mb-2">What do you do?</h3>
                  <p className="text-muted-foreground mb-8 text-sm">Choose your profession</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto">
                    {PROFESSIONS.map((p) => (
                      <button
                        key={p.label}
                        onClick={() => setDemoData((d) => ({ ...d, profession: p.label }))}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 hover:scale-[1.03] ${
                          demoData.profession === p.label
                            ? "border-primary bg-primary/5 shadow-md"
                            : "border-border bg-card hover:border-primary/40"
                        }`}
                      >
                        <span className="text-2xl">{p.icon}</span>
                        <span className="text-sm font-medium text-foreground">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div key="step1" {...fadeSlide}>
                  <h3 className="text-2xl font-bold text-foreground mb-2">Tell us about you</h3>
                  <p className="text-muted-foreground mb-8 text-sm">Just the basics — takes 10 seconds</p>
                  <div className="grid gap-4 max-w-sm mx-auto text-left">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Your Name *</label>
                      <Input
                        placeholder="John Smith"
                        value={demoData.name}
                        onChange={(e) => setDemoData((d) => ({ ...d, name: e.target.value }))}
                        className="h-12 text-base"
                        maxLength={60}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Business Name</label>
                      <Input
                        placeholder="Smith & Sons Construction"
                        value={demoData.company}
                        onChange={(e) => setDemoData((d) => ({ ...d, company: e.target.value }))}
                        className="h-12 text-base"
                        maxLength={80}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">Phone</label>
                        <Input
                          placeholder="(555) 123-4567"
                          value={demoData.phone}
                          onChange={(e) => setDemoData((d) => ({ ...d, phone: e.target.value }))}
                          className="h-12 text-base"
                          maxLength={20}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">City</label>
                        <Input
                          placeholder="Austin, TX"
                          value={demoData.city}
                          onChange={(e) => setDemoData((d) => ({ ...d, city: e.target.value }))}
                          className="h-12 text-base"
                          maxLength={50}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" {...fadeSlide}>
                  <h3 className="text-2xl font-bold text-foreground mb-2">Pick your style</h3>
                  <p className="text-muted-foreground mb-8 text-sm">Choose the vibe that fits your brand</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
                    {STYLES.map((s) => (
                      <button
                        key={s.key}
                        onClick={() => setDemoData((d) => ({ ...d, style: s.key }))}
                        className={`relative p-5 rounded-xl border-2 transition-all duration-200 hover:scale-[1.03] text-left ${
                          demoData.style === s.key
                            ? "border-primary bg-primary/5 shadow-md"
                            : "border-border bg-card hover:border-primary/40"
                        }`}
                      >
                        <div className={`h-3 w-12 rounded-full bg-gradient-to-r ${s.color} mb-3`} />
                        <span className="text-base font-semibold text-foreground block">{s.key}</span>
                        <span className="text-xs text-muted-foreground">{s.desc}</span>
                        {demoData.style === s.key && (
                          <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className="flex items-center justify-center gap-3 mt-10">
              {step > 0 && (
                <Button variant="outline" size="lg" onClick={() => setStep(step - 1)}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
              )}
              <Button size="lg" className="shadow-glow px-8" disabled={!canNext} onClick={handleNext}>
                {step === 2 ? (
                  <>Generate My Card <Sparkles className="h-4 w-4 ml-1" /></>
                ) : (
                  <>Next <ArrowRight className="h-4 w-4 ml-1" /></>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
