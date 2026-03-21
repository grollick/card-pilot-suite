import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, Eye, Sparkles, Check, User, Palette, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import OnboardingStepWrapper from "./OnboardingStepWrapper";

interface Props {
  name: string;
  company: string;
  phone: string;
  city: string;
  tagline?: string;
  services: string[];
  aiLoading: boolean;
  onNext: () => void;
  onBack: () => void;
}

const PROGRESS_STEPS = [
  { label: "Setting up your profile", icon: User },
  { label: "Designing your card", icon: Palette },
  { label: "Getting you ready for leads", icon: Zap },
];

export default function StepCardPreview({ name, company, phone, city, tagline, services, aiLoading, onNext, onBack }: Props) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!aiLoading) return;
    setActiveStep(0);
    const interval = setInterval(() => {
      setActiveStep((prev) => Math.min(prev + 1, PROGRESS_STEPS.length - 1));
    }, 2200);
    return () => clearInterval(interval);
  }, [aiLoading]);

  if (aiLoading) {
    const progress = ((activeStep + 1) / PROGRESS_STEPS.length) * 100;

    return (
      <OnboardingStepWrapper stepKey="card-loading">
        <div className="py-6 space-y-8">
          {/* Animated icon */}
          <div className="text-center space-y-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="mx-auto h-16 w-16 rounded-2xl flex items-center justify-center bg-primary/10"
            >
              <Sparkles className="h-8 w-8 text-primary" />
            </motion.div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Creating your card…</h2>
              <p className="text-sm text-muted-foreground mt-1">This only takes a moment</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-3">
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: "5%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>

            {/* Steps */}
            <div className="space-y-2">
              {PROGRESS_STEPS.map((step, i) => {
                const Icon = step.icon;
                const done = i < activeStep;
                const active = i === activeStep;
                return (
                  <motion.div
                    key={step.label}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.15 }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      active ? "bg-primary/5 border border-primary/20" :
                      done ? "border border-border bg-muted/30" :
                      "border border-transparent"
                    }`}
                  >
                    {done ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      >
                        <Check className="h-4 w-4 text-primary" />
                      </motion.div>
                    ) : active ? (
                      <motion.div
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                      >
                        <Icon className="h-4 w-4 text-primary" />
                      </motion.div>
                    ) : (
                      <Icon className="h-4 w-4 text-muted-foreground/30" />
                    )}
                    <span className={`text-sm font-medium ${
                      active ? "text-foreground" : done ? "text-muted-foreground" : "text-muted-foreground/30"
                    }`}>
                      {step.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </OnboardingStepWrapper>
    );
  }

  // Card reveal with animation
  return (
    <OnboardingStepWrapper stepKey="card-preview">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="text-center mb-3">
          <h2 className="text-lg font-semibold flex items-center justify-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Your card preview
          </h2>
          <p className="text-sm text-muted-foreground">Here's what your digital card looks like</p>
        </div>

        {/* Mini card preview with reveal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg"
        >
          <div className="h-24 bg-gradient-to-br from-primary to-accent relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 200, damping: 15 }}
              className="absolute -bottom-7 left-4 h-14 w-14 rounded-full bg-card border-3 border-card flex items-center justify-center text-primary font-bold text-xl shadow-md"
            >
              {name ? name[0].toUpperCase() : "?"}
            </motion.div>
          </div>
          <div className="pt-10 px-4 pb-4 space-y-2">
            <div>
              <p className="font-bold text-base text-foreground">{name || "Your Name"}</p>
              {tagline && <p className="text-xs text-primary font-medium mt-0.5">{tagline}</p>}
              {company && <p className="text-sm text-muted-foreground">{company}</p>}
            </div>
            <div className="flex flex-wrap gap-1">
              {city && <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">📍 {city}</span>}
              {phone && <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">📞 {phone}</span>}
            </div>
            {services.length > 0 && (
              <div className="pt-2 space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Services</p>
                <div className="flex flex-wrap gap-1">
                  {services.slice(0, 4).map(s => (
                    <span key={s} className="px-2 py-0.5 rounded-full bg-muted text-[11px] font-medium text-muted-foreground">{s}</span>
                  ))}
                  {services.length > 4 && (
                    <span className="px-2 py-0.5 rounded-full bg-muted text-[11px] text-muted-foreground">+{services.length - 4}</span>
                  )}
                </div>
              </div>
            )}
            <div className="pt-2 flex gap-2">
              <span className="flex-1 text-center py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">Get Estimate</span>
              <span className="flex-1 text-center py-2 rounded-lg bg-secondary text-secondary-foreground text-xs font-semibold">Call Now</span>
            </div>
          </div>
        </motion.div>

        <p className="text-xs text-muted-foreground text-center mt-3">You can customize everything later in the card builder</p>

        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={onBack} className="flex-1">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <Button onClick={onNext} className="flex-1">
            Continue <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </motion.div>
    </OnboardingStepWrapper>
  );
}
